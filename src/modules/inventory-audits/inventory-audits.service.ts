import { prisma } from '../../db/prisma';
import { runInTransaction } from '../../shared/db/transaction';
import { NotFoundError, ValidationError } from '../../shared/errors/app-error';
import { DocumentNumberService } from '../documents/document-number.service';
import { DocumentLifecycleService } from '../documents/document-lifecycle.service';
import { StockLedgerService } from '../stock/stock-ledger.service';
import { StockAvailabilityService } from '../stock/stock-availability.service';
import { AuditLogService } from '../audit/audit-log.service';
import { InventoryAuditStatus, MovementType, MovementStatus, Prisma } from '@prisma/client';
import { resolveWorkflowUserId } from '../../shared/auth/workflow-user';
import {
  CountInventoryAuditInput,
  CreateInventoryAuditInput,
  InventoryAuditQuery,
  UpdateInventoryAuditInput,
} from './inventory-audits.schemas';

type AuditLineInput = {
  itemId: string;
  actualQuantity?: number;
  unitId: string;
  batchId?: string | null;
};

export class InventoryAuditsService {
  private static async buildAuditLineInputs(
    client: Prisma.TransactionClient,
    organizationId: string,
    locationId: string,
    lines: AuditLineInput[]
  ): Promise<Prisma.InventoryAuditLineCreateManyInventoryAuditInput[]> {
    const lineCreateInputs: Prisma.InventoryAuditLineCreateManyInventoryAuditInput[] = [];

    for (const line of lines) {
      const item = await client.item.findFirst({
        where: { id: line.itemId, organizationId },
      });
      if (!item) {
        throw new NotFoundError(`Item ID ${line.itemId} not found`);
      }
      if (!item.isActive) {
        throw new ValidationError(`Item "${item.name}" is inactive`);
      }

      const unit = await client.unit.findFirst({
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
        const batch = await client.stockBatch.findFirst({
          where: { id: line.batchId, itemId: line.itemId, organizationId },
        });
        if (!batch) {
          throw new NotFoundError(`Batch ID ${line.batchId} not found for item ${line.itemId}`);
        }
      }

      const expectedQuantity = await StockLedgerService.calculateBalanceForItemLocation(
        organizationId,
        line.itemId,
        locationId,
        line.batchId ?? undefined
      );
      const actualQuantity = line.actualQuantity ?? expectedQuantity;

      lineCreateInputs.push({
        itemId: line.itemId,
        batchId: line.batchId || null,
        expectedQuantity,
        actualQuantity,
        discrepancyQuantity: actualQuantity - expectedQuantity,
        unitId: line.unitId,
      });
    }

    return lineCreateInputs;
  }

  private static async assertActiveLocation(
    client: Prisma.TransactionClient,
    organizationId: string,
    locationId: string
  ) {
    const location = await client.stockLocation.findFirst({
      where: { id: locationId, organizationId },
    });

    if (!location) {
      throw new NotFoundError(`Location ID ${locationId} not found`);
    }
    if (!location.isActive) {
      throw new ValidationError(`Location "${location.name}" is inactive`);
    }

    return location;
  }

  /**
   * Create a new Inventory Audit in DRAFT state.
   * Automatically populates lines from current stock balances at the specified location.
   */
  public static async create(
    organizationId: string,
    userId: string | undefined,
    data: CreateInventoryAuditInput
  ) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const auditNumber = await DocumentNumberService.generateNextNumber(
        organizationId,
        'INV',
        tx
      );

      await this.assertActiveLocation(tx, organizationId, data.locationId);

      const lineCreateInputs: Prisma.InventoryAuditLineCreateWithoutInventoryAuditInput[] = [];
      if (data.lines) {
        const preparedLines = await this.buildAuditLineInputs(tx, organizationId, data.locationId, data.lines);
        for (const line of preparedLines) {
          lineCreateInputs.push({
            item: { connect: { id: line.itemId } },
            batch: line.batchId ? { connect: { id: line.batchId } } : undefined,
            expectedQuantity: line.expectedQuantity,
            actualQuantity: line.actualQuantity,
            discrepancyQuantity: line.discrepancyQuantity,
            unit: { connect: { id: line.unitId } },
          });
        }
      }

      const audit = await tx.inventoryAudit.create({
        data: {
          organizationId,
          auditNumber,
          auditDate: data.auditDate ? new Date(data.auditDate) : new Date(),
          locationId: data.locationId,
          status: InventoryAuditStatus.DRAFT,
          auditorUserId: effectiveUserId,
          lines: {
            create: lineCreateInputs,
          },
        },
        include: {
          lines: true,
        },
      });

      return audit;
    });
  }

  /**
   * Update a draft Inventory Audit's lines.
   * Replaces all lines with new ones, computing discrepancy from current stock balances.
   */
  public static async update(
    organizationId: string,
    id: string,
    data: UpdateInventoryAuditInput
  ) {
    return runInTransaction(async (tx) => {
      const audit = await tx.inventoryAudit.findFirst({
        where: { id, organizationId },
      });

      if (!audit) {
        throw new NotFoundError(`Inventory audit not found with ID ${id}`);
      }

      if (audit.status !== InventoryAuditStatus.DRAFT) {
        throw new ValidationError(
          `Cannot update audit: current status is "${audit.status}" (expected DRAFT)`
        );
      }

      const updateData: Prisma.InventoryAuditUncheckedUpdateInput = {};
      if (data.auditDate) updateData.auditDate = new Date(data.auditDate);
      if (data.locationId) {
        await this.assertActiveLocation(tx, organizationId, data.locationId);
        updateData.locationId = data.locationId;
      }

      if (data.lines) {
        // Delete existing lines
        await tx.inventoryAuditLine.deleteMany({
          where: { inventoryAuditId: id },
        });

        const lineCreateInputs = await this.buildAuditLineInputs(
          tx,
          organizationId,
          data.locationId || audit.locationId,
          data.lines
        );

        updateData.lines = {
          createMany: {
            data: lineCreateInputs,
          },
        };
      }

      return tx.inventoryAudit.update({
        where: { id },
        data: updateData,
        include: {
          lines: true,
        },
      });
    });
  }

  /**
   * Record counts for a DRAFT audit, transitioning it to COUNTED.
   */
  public static async count(
    organizationId: string,
    id: string,
    userId: string | undefined,
    data: CountInventoryAuditInput
  ) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const audit = await tx.inventoryAudit.findFirst({
        where: { id, organizationId },
      });

      if (!audit) {
        throw new NotFoundError(`Inventory audit not found with ID ${id}`);
      }

      if (audit.status !== InventoryAuditStatus.DRAFT) {
        throw new ValidationError(
          `Cannot count audit: current status is "${audit.status}" (expected DRAFT)`
        );
      }

      await tx.inventoryAuditLine.deleteMany({
        where: { inventoryAuditId: id },
      });

      const lineCreateInputs = await this.buildAuditLineInputs(tx, organizationId, audit.locationId, data.lines);

      const updatedAudit = await tx.inventoryAudit.update({
        where: { id },
        data: {
          status: InventoryAuditStatus.COUNTED,
          countedAt: new Date(),
          lines: {
            createMany: {
              data: lineCreateInputs,
            },
          },
        },
        include: { lines: true },
      });

      await AuditLogService.recordAction(
        {
          organizationId,
          userId: effectiveUserId,
          action: 'COUNT',
          entityType: 'InventoryAudit',
          entityId: id,
          newValue: { status: InventoryAuditStatus.COUNTED },
        },
        tx
      );

      return updatedAudit;
    });
  }

  /**
   * Approve a COUNTED audit, creating INVENTORY_ADJUSTMENT stock movements for discrepancies.
   */
  public static async approve(
    organizationId: string,
    id: string,
    userId: string | undefined
  ) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const audit = await tx.inventoryAudit.findFirst({
        where: { id, organizationId },
        include: { lines: true },
      });

      if (!audit) {
        throw new NotFoundError(`Inventory audit not found with ID ${id}`);
      }

      if (audit.status !== InventoryAuditStatus.COUNTED) {
        throw new ValidationError(
          `Cannot approve audit: current status is "${audit.status}" (expected COUNTED)`
        );
      }

      // Filter lines with discrepancies
      const discrepancyLines = audit.lines.filter(
        (line) => Number(line.discrepancyQuantity) !== 0
      );

      if (discrepancyLines.length > 0) {
        const movementLines: {
          itemId: string;
          batchId?: string | null;
          quantity: number;
          unitId: string;
          sourceLocationId?: string | null;
          targetLocationId?: string | null;
        }[] = [];

        for (const line of discrepancyLines) {
          const discrepancy = Number(line.discrepancyQuantity);

          if (discrepancy < 0) {
            // Shortage: actual < expected; remove stock from location.
            await StockAvailabilityService.assertAvailable(
              organizationId,
              line.itemId,
              audit.locationId,
              Math.abs(discrepancy),
              line.batchId
            );

            movementLines.push({
              itemId: line.itemId,
              batchId: line.batchId,
              quantity: Math.abs(discrepancy),
              unitId: line.unitId,
              sourceLocationId: audit.locationId,
              targetLocationId: null,
            });
          } else {
            // Surplus: actual > expected; add stock to location.
            movementLines.push({
              itemId: line.itemId,
              batchId: line.batchId,
              quantity: Math.abs(discrepancy),
              unitId: line.unitId,
              sourceLocationId: null,
              targetLocationId: audit.locationId,
            });
          }
        }

        // Create and post stock movement
        const movement = await StockLedgerService.createMovementDraft(
          organizationId,
          {
            type: MovementType.INVENTORY_ADJUSTMENT,
            sourceDocumentType: 'InventoryAudit',
            sourceDocumentId: audit.id,
            createdByUserId: effectiveUserId,
            timestamp: audit.auditDate,
            lines: movementLines,
          },
          tx
        );

        await StockLedgerService.postMovement(organizationId, movement.id, effectiveUserId, tx);
      }

      const updatedAudit = await tx.inventoryAudit.update({
        where: { id },
        data: {
          status: InventoryAuditStatus.APPROVED,
          approvedAt: new Date(),
        },
        include: { lines: true },
      });

      await AuditLogService.recordAction(
        {
          organizationId,
          userId: effectiveUserId,
          action: 'APPROVE',
          entityType: 'InventoryAudit',
          entityId: id,
          newValue: { status: InventoryAuditStatus.APPROVED },
        },
        tx
      );

      return updatedAudit;
    });
  }

  /**
   * Cancel an Inventory Audit. If APPROVED, reverses stock movements.
   */
  public static async cancel(
    organizationId: string,
    id: string,
    userId: string | undefined
  ) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const audit = await tx.inventoryAudit.findFirst({
        where: { id, organizationId },
        include: { lines: true },
      });

      if (!audit) {
        throw new NotFoundError(`Inventory audit not found with ID ${id}`);
      }

      DocumentLifecycleService.assertCanCancel(audit);

      // If previously approved, cancel the associated stock movement
      if (audit.status === InventoryAuditStatus.APPROVED) {
        for (const line of audit.lines) {
          const discrepancy = Number(line.discrepancyQuantity);
          if (discrepancy > 0) {
            await StockAvailabilityService.assertAvailable(
              organizationId,
              line.itemId,
              audit.locationId,
              discrepancy,
              line.batchId
            );
          }
        }

        const movement = await tx.stockMovement.findFirst({
          where: {
            organizationId,
            sourceDocumentId: id,
            sourceDocumentType: 'InventoryAudit',
            status: MovementStatus.POSTED,
          },
        });

        if (movement) {
          await StockLedgerService.cancelMovement(organizationId, movement.id, tx);
        }
      }

      const updatedAudit = await tx.inventoryAudit.update({
        where: { id },
        data: {
          status: InventoryAuditStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      await AuditLogService.recordAction(
        {
          organizationId,
          userId: effectiveUserId,
          action: 'CANCEL',
          entityType: 'InventoryAudit',
          entityId: id,
          newValue: { status: InventoryAuditStatus.CANCELLED },
        },
        tx
      );

      return updatedAudit;
    });
  }

  /**
   * Find an Inventory Audit by ID.
   */
  public static async findById(organizationId: string, id: string) {
    const audit = await prisma.inventoryAudit.findFirst({
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
        auditor: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!audit) {
      throw new NotFoundError(`Inventory audit not found with ID ${id}`);
    }

    return audit;
  }

  /**
   * List Inventory Audits with pagination and optional status filter.
   */
  public static async list(organizationId: string, query: InventoryAuditQuery) {
    const { page = 1, pageSize = 20, status } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.InventoryAuditWhereInput = {
      organizationId,
    };

    if (status) where.status = status;

    const [total, data] = await Promise.all([
      prisma.inventoryAudit.count({ where }),
      prisma.inventoryAudit.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          lines: {
            include: {
              item: true,
              unit: true,
              batch: true,
            },
          },
          location: { select: { id: true, name: true } },
          auditor: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return { total, data };
  }
}
export default InventoryAuditsService;
