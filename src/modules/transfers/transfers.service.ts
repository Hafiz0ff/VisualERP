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
  CreateTransferInput,
  TransferQuery,
  UpdateTransferInput,
} from './transfers.schemas';

export class TransfersService {
  /**
   * Create a new stock Transfer in DRAFT state.
   */
  public static async create(organizationId: string, userId: string | undefined, data: CreateTransferInput) {
    if (data.sourceLocationId === data.targetLocationId) {
      throw new ValidationError('Source and target locations must be different');
    }

    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const transferNumber = await DocumentNumberService.generateNextNumber(
        organizationId,
        'TRF',
        tx
      );

      // Validate source location
      const sourceLoc = await tx.stockLocation.findFirst({
        where: { id: data.sourceLocationId, organizationId },
      });
      if (!sourceLoc) {
        throw new NotFoundError(`Source location ID ${data.sourceLocationId} not found`);
      }
      if (!sourceLoc.isActive) {
        throw new ValidationError(`Source location "${sourceLoc.name}" is inactive`);
      }

      // Validate target location
      const targetLoc = await tx.stockLocation.findFirst({
        where: { id: data.targetLocationId, organizationId },
      });
      if (!targetLoc) {
        throw new NotFoundError(`Target location ID ${data.targetLocationId} not found`);
      }
      if (!targetLoc.isActive) {
        throw new ValidationError(`Target location "${targetLoc.name}" is inactive`);
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

      const transfer = await tx.transfer.create({
        data: {
          organizationId,
          transferNumber,
          sourceLocationId: data.sourceLocationId,
          targetLocationId: data.targetLocationId,
          date: new Date(data.date),
          status: DocumentStatus.DRAFT,
          createdByUserId: effectiveUserId,
          lines: {
            create: data.lines.map((line) => ({
              itemId: line.itemId,
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

      return transfer;
    });
  }

  /**
   * Update a draft Transfer.
   */
  public static async update(organizationId: string, id: string, data: UpdateTransferInput) {
    return runInTransaction(async (tx) => {
      const transfer = await tx.transfer.findFirst({
        where: { id, organizationId },
      });

      if (!transfer) {
        throw new NotFoundError(`Transfer not found with ID ${id}`);
      }

      DocumentLifecycleService.assertCanUpdateDraft(transfer);

      const srcLocId = data.sourceLocationId || transfer.sourceLocationId;
      const tgtLocId = data.targetLocationId || transfer.targetLocationId;

      if (srcLocId === tgtLocId) {
        throw new ValidationError('Source and target locations must be different');
      }

      // Validate locations if changed
      if (data.sourceLocationId) {
        const sourceLoc = await tx.stockLocation.findFirst({
          where: { id: data.sourceLocationId, organizationId },
        });
        if (!sourceLoc) {
          throw new NotFoundError(`Source location ID ${data.sourceLocationId} not found`);
        }
        if (!sourceLoc.isActive) {
          throw new ValidationError(`Source location "${sourceLoc.name}" is inactive`);
        }
      }
      if (data.targetLocationId) {
        const targetLoc = await tx.stockLocation.findFirst({
          where: { id: data.targetLocationId, organizationId },
        });
        if (!targetLoc) {
          throw new NotFoundError(`Target location ID ${data.targetLocationId} not found`);
        }
        if (!targetLoc.isActive) {
          throw new ValidationError(`Target location "${targetLoc.name}" is inactive`);
        }
      }

      const updateData: Prisma.TransferUncheckedUpdateInput = {};
      if (data.date) updateData.date = new Date(data.date);
      if (data.sourceLocationId) updateData.sourceLocationId = data.sourceLocationId;
      if (data.targetLocationId) updateData.targetLocationId = data.targetLocationId;

      if (data.lines) {
        // Delete old lines
        await tx.transferLine.deleteMany({
          where: { transferId: id },
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
            quantity: line.quantity,
            unitId: line.unitId,
            batchId: line.batchId || null,
          })),
        };
      }

      return tx.transfer.update({
        where: { id },
        data: updateData,
        include: {
          lines: true,
        },
      });
    });
  }

  /**
   * Post a draft Transfer, executing stock check and ledger postings.
   */
  public static async post(organizationId: string, id: string, userId: string | undefined) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const transfer = await tx.transfer.findFirst({
        where: { id, organizationId },
        include: { lines: true },
      });

      if (!transfer) {
        throw new NotFoundError(`Transfer not found with ID ${id}`);
      }

      DocumentLifecycleService.assertCanPost(transfer);

      const movementLines = [];

      for (const line of transfer.lines) {
        // Enforce availability check on source location (supports specific batch checking)
        await StockAvailabilityService.assertAvailable(
          organizationId,
          line.itemId,
          transfer.sourceLocationId,
          Number(line.quantity),
          line.batchId
        );

        movementLines.push({
          itemId: line.itemId,
          batchId: line.batchId,
          quantity: Number(line.quantity), // Absolute value
          unitId: line.unitId,
          sourceLocationId: transfer.sourceLocationId,
          targetLocationId: transfer.targetLocationId,
        });
      }

      // Create and post the stock movement
      const movement = await StockLedgerService.createMovementDraft(
        organizationId,
        {
          type: MovementType.TRANSFER,
          sourceDocumentType: 'Transfer',
          sourceDocumentId: transfer.id,
          createdByUserId: effectiveUserId,
          timestamp: transfer.date,
          lines: movementLines,
        },
        tx
      );

      await StockLedgerService.postMovement(organizationId, movement.id, effectiveUserId, tx);

      // Transition document status
      const updatedTransfer = await tx.transfer.update({
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
          entityType: 'Transfer',
          entityId: transfer.id,
          newValue: { status: DocumentStatus.POSTED },
        },
        tx
      );

      return updatedTransfer;
    });
  }

  /**
   * Cancel a Transfer.
   */
  public static async cancel(organizationId: string, id: string, userId: string | undefined) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const transfer = await tx.transfer.findFirst({
        where: { id, organizationId },
        include: { lines: true },
      });

      if (!transfer) {
        throw new NotFoundError(`Transfer not found with ID ${id}`);
      }

      DocumentLifecycleService.assertCanCancel(transfer);

      // If document was posted, neutralize its stock movements
      if (transfer.status === DocumentStatus.POSTED) {
        // Enforce availability check: cancelling the transfer will subtract stock from target location
        for (const line of transfer.lines) {
          await StockAvailabilityService.assertAvailable(
            organizationId,
            line.itemId,
            transfer.targetLocationId,
            Number(line.quantity),
            line.batchId
          );
        }

        const movement = await tx.stockMovement.findFirst({
          where: {
            organizationId,
            sourceDocumentId: id,
            sourceDocumentType: 'Transfer',
            status: MovementStatus.POSTED,
          },
        });

        if (movement) {
          await StockLedgerService.cancelMovement(organizationId, movement.id, tx);
        }
      }

      const updatedTransfer = await tx.transfer.update({
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
          entityType: 'Transfer',
          entityId: id,
          newValue: { status: DocumentStatus.CANCELLED },
        },
        tx
      );

      return updatedTransfer;
    });
  }

  /**
   * Find a Transfer by ID.
   */
  public static async findById(organizationId: string, id: string) {
    const transfer = await prisma.transfer.findFirst({
      where: { id, organizationId },
      include: {
        lines: {
          include: {
            item: true,
            unit: true,
            batch: true,
          },
        },
        sourceLocation: true,
        targetLocation: true,
      },
    });

    if (!transfer) {
      throw new NotFoundError(`Transfer not found with ID ${id}`);
    }

    return transfer;
  }

  /**
   * List Transfers.
   */
  public static async list(organizationId: string, query: TransferQuery) {
    const { page = 1, pageSize = 20, status } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.TransferWhereInput = {
      organizationId,
    };

    if (status) where.status = status;

    const [total, data] = await Promise.all([
      prisma.transfer.count({ where }),
      prisma.transfer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          sourceLocation: { select: { id: true, name: true } },
          targetLocation: { select: { id: true, name: true } },
        },
      }),
    ]);

    return { total, data };
  }
}
export default TransfersService;
