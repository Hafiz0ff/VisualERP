import { prisma } from '../../db/prisma';
import { runInTransaction } from '../../shared/db/transaction';
import { NotFoundError, ValidationError } from '../../shared/errors/app-error';
import { DocumentNumberService } from '../documents/document-number.service';
import { DocumentLifecycleService } from '../documents/document-lifecycle.service';
import { StockLedgerService } from '../stock/stock-ledger.service';
import { StockAvailabilityService } from '../stock/stock-availability.service';
import { AuditLogService } from '../audit/audit-log.service';
import { DocumentStatus, MovementStatus, MovementType, Prisma } from '@prisma/client';
import { resolveWorkflowUserId } from '../../shared/auth/workflow-user';
import {
  CreateWriteOffInput,
  UpdateWriteOffInput,
  WriteOffQuery,
} from './write-offs.schemas';

export class WriteOffsService {
  /**
   * Create a new stock Write-off in DRAFT state.
   */
  public static async create(organizationId: string, userId: string | undefined, data: CreateWriteOffInput) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const writeOffNumber = await DocumentNumberService.generateNextNumber(
        organizationId,
        'WOF',
        tx
      );

      // Validate location
      const location = await tx.stockLocation.findFirst({
        where: { id: data.locationId, organizationId },
      });
      if (!location) {
        throw new NotFoundError(`Location ID ${data.locationId} not found`);
      }
      if (!location.isActive) {
        throw new ValidationError(`Location "${location.name}" is inactive`);
      }

      // Validate all items and units
      for (const line of data.lines) {
        const item = await tx.item.findFirst({
          where: { id: line.itemId, organizationId },
        });
        if (!item) {
          throw new NotFoundError(`Item ID ${line.itemId} not found`);
        }
        if (!item.isActive) {
          throw new ValidationError(`Item "${item.name}" is inactive`);
        }

        const unit = await tx.unit.findFirst({
          where: {
            id: line.unitId,
            OR: [
              { organizationId },
              { organizationId: null },
            ],
          },
        });
        if (!unit) {
          throw new NotFoundError(`Unit ID ${line.unitId} not found`);
        }

        // Validate batchId if provided
        if (line.batchId) {
          const batch = await tx.stockBatch.findFirst({
            where: { id: line.batchId, itemId: line.itemId, organizationId },
          });
          if (!batch) {
            throw new NotFoundError(`Batch ID ${line.batchId} not found for item ${line.itemId}`);
          }
        }
      }

      const writeOff = await tx.writeOff.create({
        data: {
          organizationId,
          writeOffNumber,
          date: new Date(data.date),
          locationId: data.locationId,
          reason: data.reason,
          description: data.description || null,
          status: DocumentStatus.DRAFT,
          responsibleUserId: effectiveUserId,
          lines: {
            create: data.lines.map((line) => ({
              itemId: line.itemId,
              locationId: data.locationId,
              quantity: line.quantity,
              unitId: line.unitId,
              batchId: line.batchId || null,
            })),
          },
        },
        include: {
          lines: true,
        },
      });

      return writeOff;
    });
  }

  /**
   * Update a draft Write-off.
   */
  public static async update(organizationId: string, id: string, data: UpdateWriteOffInput) {
    return runInTransaction(async (tx) => {
      const writeOff = await tx.writeOff.findFirst({
        where: { id, organizationId },
      });

      if (!writeOff) {
        throw new NotFoundError(`Write-off not found with ID ${id}`);
      }

      DocumentLifecycleService.assertCanUpdateDraft(writeOff);

      // Validate location if changed
      const finalLocId = data.locationId || writeOff.locationId;
      if (data.locationId) {
        const location = await tx.stockLocation.findFirst({
          where: { id: data.locationId, organizationId },
        });
        if (!location) {
          throw new NotFoundError(`Location ID ${data.locationId} not found`);
        }
        if (!location.isActive) {
          throw new ValidationError(`Location "${location.name}" is inactive`);
        }
      }

      const updateData: Prisma.WriteOffUncheckedUpdateInput = {};
      if (data.date) updateData.date = new Date(data.date);
      if (data.locationId) updateData.locationId = data.locationId;
      if (data.reason) updateData.reason = data.reason;
      if (data.description !== undefined) updateData.description = data.description;

      if (data.lines) {
        // Delete old lines
        await tx.writeOffLine.deleteMany({
          where: { writeOffId: id },
        });

        // Validate new lines
        for (const line of data.lines) {
          const item = await tx.item.findFirst({
            where: { id: line.itemId, organizationId },
          });
          if (!item) {
            throw new NotFoundError(`Item ID ${line.itemId} not found`);
          }
          if (!item.isActive) {
            throw new ValidationError(`Item "${item.name}" is inactive`);
          }

          const unit = await tx.unit.findFirst({
            where: {
              id: line.unitId,
              OR: [
                { organizationId },
                { organizationId: null },
              ],
            },
          });
          if (!unit) {
            throw new NotFoundError(`Unit ID ${line.unitId} not found`);
          }

          if (line.batchId) {
            const batch = await tx.stockBatch.findFirst({
              where: { id: line.batchId, itemId: line.itemId, organizationId },
            });
            if (!batch) {
              throw new NotFoundError(`Batch ID ${line.batchId} not found`);
            }
          }
        }

        updateData.lines = {
          create: data.lines.map((line) => ({
            itemId: line.itemId,
            locationId: finalLocId,
            quantity: line.quantity,
            unitId: line.unitId,
            batchId: line.batchId || null,
          })),
        };
      } else if (data.locationId) {
        // If location changed but lines didn't, update locationId in existing lines
        await tx.writeOffLine.updateMany({
          where: { writeOffId: id },
          data: { locationId: data.locationId },
        });
      }

      return tx.writeOff.update({
        where: { id },
        data: updateData,
        include: {
          lines: true,
        },
      });
    });
  }

  /**
   * Post a draft Write-off, committing stock mutations.
   */
  public static async post(organizationId: string, id: string, userId: string | undefined) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const writeOff = await tx.writeOff.findFirst({
        where: { id, organizationId },
        include: { lines: true },
      });

      if (!writeOff) {
        throw new NotFoundError(`Write-off not found with ID ${id}`);
      }

      DocumentLifecycleService.assertCanPost(writeOff);

      const movementLines = [];

      for (const line of writeOff.lines) {
        // Assert stock availability at write-off location (optionally scoped by batch)
        await StockAvailabilityService.assertAvailable(
          organizationId,
          line.itemId,
          writeOff.locationId,
          Number(line.quantity),
          line.batchId
        );

        movementLines.push({
          itemId: line.itemId,
          batchId: line.batchId,
          quantity: Number(line.quantity), // Absolute value
          unitId: line.unitId,
          sourceLocationId: writeOff.locationId, // Outgoing from location
          targetLocationId: null, // Virtual target
        });
      }

      // Create and post stock movement
      const movement = await StockLedgerService.createMovementDraft(
        organizationId,
        {
          type: MovementType.WRITE_OFF,
          sourceDocumentType: 'WriteOff',
          sourceDocumentId: writeOff.id,
          createdByUserId: effectiveUserId,
          timestamp: writeOff.date,
          lines: movementLines,
        },
        tx
      );

      await StockLedgerService.postMovement(organizationId, movement.id, effectiveUserId, tx);

      // Transition document status
      const updatedWriteOff = await tx.writeOff.update({
        where: { id },
        data: {
          status: DocumentStatus.POSTED,
          postedAt: new Date(),
        },
        include: { lines: true },
      });

      // Audit Log
      await AuditLogService.recordAction(
        {
          organizationId,
          userId: effectiveUserId,
          action: 'POST',
          entityType: 'WriteOff',
          entityId: writeOff.id,
          newValue: { status: DocumentStatus.POSTED },
        },
        tx
      );

      return updatedWriteOff;
    });
  }

  /**
   * Cancel a Write-off.
   */
  public static async cancel(organizationId: string, id: string, userId: string | undefined) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const writeOff = await tx.writeOff.findFirst({
        where: { id, organizationId },
      });

      if (!writeOff) {
        throw new NotFoundError(`Write-off not found with ID ${id}`);
      }

      DocumentLifecycleService.assertCanCancel(writeOff);

      // If document was posted, neutralize its stock movements
      if (writeOff.status === DocumentStatus.POSTED) {
        const movement = await tx.stockMovement.findFirst({
          where: {
            organizationId,
            sourceDocumentId: id,
            sourceDocumentType: 'WriteOff',
            status: MovementStatus.POSTED,
          },
        });

        if (movement) {
          await StockLedgerService.cancelMovement(organizationId, movement.id, tx);
        }
      }

      const updatedWriteOff = await tx.writeOff.update({
        where: { id },
        data: {
          status: DocumentStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      // Audit Log
      await AuditLogService.recordAction(
        {
          organizationId,
          userId: effectiveUserId,
          action: 'CANCEL',
          entityType: 'WriteOff',
          entityId: id,
          newValue: { status: DocumentStatus.CANCELLED },
        },
        tx
      );

      return updatedWriteOff;
    });
  }

  /**
   * Find a Write-off by ID.
   */
  public static async findById(organizationId: string, id: string) {
    const writeOff = await prisma.writeOff.findFirst({
      where: { id, organizationId },
      include: {
        lines: {
          include: {
            item: true,
            unit: true,
            batch: true,
          },
        },
        location: true,
        responsibleUser: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!writeOff) {
      throw new NotFoundError(`Write-off not found with ID ${id}`);
    }

    return writeOff;
  }

  /**
   * List Write-offs.
   */
  public static async list(organizationId: string, query: WriteOffQuery) {
    const { page = 1, pageSize = 20, status } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.WriteOffWhereInput = {
      organizationId,
    };

    if (status) where.status = status;

    const [total, data] = await Promise.all([
      prisma.writeOff.count({ where }),
      prisma.writeOff.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          location: { select: { id: true, name: true } },
          responsibleUser: { select: { id: true, email: true, firstName: true, lastName: true } },
          lines: {
            include: {
              item: { select: { name: true, code: true } },
              unit: { select: { symbol: true } },
            },
          },
        },
      }),
    ]);

    return { total, data };
  }
}
export default WriteOffsService;
