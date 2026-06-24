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
  CreatePurchaseReceiptInput,
  PurchaseReceiptQuery,
  UpdatePurchaseReceiptInput,
} from './purchase-receipts.schemas';

export class PurchaseReceiptsService {
  /**
   * Create a new Purchase Receipt in DRAFT state.
   */
  public static async create(organizationId: string, userId: string | undefined, data: CreatePurchaseReceiptInput) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const receiptNumber = await DocumentNumberService.generateNextNumber(
        organizationId,
        'REC',
        tx
      );

      // Validate location existence and scope
      const location = await tx.stockLocation.findFirst({
        where: { id: data.targetLocationId, organizationId },
      });
      if (!location) {
        throw new NotFoundError(`Target location ID ${data.targetLocationId} not found in this organization`);
      }
      if (!location.isActive) {
        throw new ValidationError(`Target location "${location.name}" is inactive`);
      }

      // Verify supplier scope if provided
      if (data.supplierId) {
        const supplier = await tx.supplier.findFirst({
          where: { id: data.supplierId, organizationId },
        });
        if (!supplier) {
          throw new NotFoundError(`Supplier ID ${data.supplierId} not found in this organization`);
        }
      }

      // Verify all items and units exist in organization
      for (const line of data.lines) {
        const item = await tx.item.findFirst({
          where: { id: line.itemId, organizationId },
        });
        if (!item) {
          throw new NotFoundError(`Item ID ${line.itemId} not found in this organization`);
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
          throw new NotFoundError(`Unit ID ${line.unitId} not found in this organization`);
        }
      }

      const receipt = await tx.purchaseReceipt.create({
        data: {
          organizationId,
          receiptNumber,
          date: new Date(data.date),
          supplierId: data.supplierId || null,
          targetLocationId: data.targetLocationId,
          status: DocumentStatus.DRAFT,
          createdByUserId: effectiveUserId,
          lines: {
            create: data.lines.map((line) => ({
              itemId: line.itemId,
              quantity: line.quantity,
              unitId: line.unitId,
              batchNumber: line.batchNumber,
              expirationDate: line.expirationDate ? new Date(line.expirationDate) : null,
              costPerUnit: line.costPerUnit,
              totalPrice: line.quantity * line.costPerUnit,
            })),
          },
        },
        include: {
          lines: true,
        },
      });

      return receipt;
    });
  }

  /**
   * Update a draft Purchase Receipt.
   */
  public static async update(organizationId: string, id: string, data: UpdatePurchaseReceiptInput) {
    return runInTransaction(async (tx) => {
      const receipt = await tx.purchaseReceipt.findFirst({
        where: { id, organizationId },
      });

      if (!receipt) {
        throw new NotFoundError(`Purchase receipt not found with ID ${id}`);
      }

      DocumentLifecycleService.assertCanUpdateDraft(receipt);

      // Validate location if changed
      if (data.targetLocationId) {
        const location = await tx.stockLocation.findFirst({
          where: { id: data.targetLocationId, organizationId },
        });
        if (!location) {
          throw new NotFoundError(`Target location ID ${data.targetLocationId} not found`);
        }
        if (!location.isActive) {
          throw new ValidationError(`Target location "${location.name}" is inactive`);
        }
      }

      // Validate supplier if changed
      if (data.supplierId) {
        const supplier = await tx.supplier.findFirst({
          where: { id: data.supplierId, organizationId },
        });
        if (!supplier) {
          throw new NotFoundError(`Supplier ID ${data.supplierId} not found`);
        }
      }

      // Prepare data payload
      const updateData: Prisma.PurchaseReceiptUncheckedUpdateInput = {};
      if (data.date) updateData.date = new Date(data.date);
      if (data.supplierId !== undefined) updateData.supplierId = data.supplierId;
      if (data.targetLocationId) updateData.targetLocationId = data.targetLocationId;

      // Handle lines replacement if supplied
      if (data.lines) {
        // Delete existing lines
        await tx.purchaseReceiptLine.deleteMany({
          where: { purchaseReceiptId: id },
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
        }

        updateData.lines = {
          create: data.lines.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            unitId: line.unitId,
            batchNumber: line.batchNumber,
            expirationDate: line.expirationDate ? new Date(line.expirationDate) : null,
            costPerUnit: line.costPerUnit,
            totalPrice: line.quantity * line.costPerUnit,
          })),
        };
      }

      return tx.purchaseReceipt.update({
        where: { id },
        data: updateData,
        include: {
          lines: true,
        },
      });
    });
  }

  /**
   * Post a draft Purchase Receipt, committing stock movements and batches.
   */
  public static async post(organizationId: string, id: string, userId: string | undefined) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const receipt = await tx.purchaseReceipt.findFirst({
        where: { id, organizationId },
        include: { lines: true },
      });

      if (!receipt) {
        throw new NotFoundError(`Purchase receipt not found with ID ${id}`);
      }

      DocumentLifecycleService.assertCanPost(receipt);

      const movementLines = [];

      for (const line of receipt.lines) {
        // Find or create StockBatch
        let batch = await tx.stockBatch.findFirst({
          where: {
            organizationId,
            itemId: line.itemId,
            batchNumber: line.batchNumber,
          },
        });

        if (!batch) {
          batch = await tx.stockBatch.create({
            data: {
              organizationId,
              itemId: line.itemId,
              batchNumber: line.batchNumber,
              unitId: line.unitId,
              expirationDate: line.expirationDate,
              costPerUnit: line.costPerUnit,
              supplierId: receipt.supplierId,
              status: 'APPROVED',
            },
          });
        }

        movementLines.push({
          itemId: line.itemId,
          batchId: batch.id,
          quantity: Number(line.quantity), // Positive for incoming receipt
          unitId: line.unitId,
          targetLocationId: receipt.targetLocationId,
          sourceLocationId: null,
          costPerUnit: Number(line.costPerUnit),
        });
      }

      // Create and post the stock movement
      const movement = await StockLedgerService.createMovementDraft(
        organizationId,
        {
          type: MovementType.PURCHASE_RECEIPT,
          sourceDocumentType: 'PurchaseReceipt',
          sourceDocumentId: receipt.id,
          createdByUserId: effectiveUserId,
          timestamp: receipt.date,
          lines: movementLines,
        },
        tx
      );

      await StockLedgerService.postMovement(organizationId, movement.id, effectiveUserId, tx);

      // Transition document state
      const updatedReceipt = await tx.purchaseReceipt.update({
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
          entityType: 'PurchaseReceipt',
          entityId: receipt.id,
          newValue: { status: DocumentStatus.POSTED },
        },
        tx
      );

      return updatedReceipt;
    });
  }

  /**
   * Cancel a Purchase Receipt.
   */
  public static async cancel(organizationId: string, id: string, userId: string | undefined) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const receipt = await tx.purchaseReceipt.findFirst({
        where: { id, organizationId },
        include: { lines: true },
      });

      if (!receipt) {
        throw new NotFoundError(`Purchase receipt not found with ID ${id}`);
      }

      DocumentLifecycleService.assertCanCancel(receipt);

      // If document was posted, neutralize the stock movement
      if (receipt.status === DocumentStatus.POSTED) {
        // Enforce availability check: cancelling the receipt will subtract stock from target location
        for (const line of receipt.lines) {
          const batch = await tx.stockBatch.findFirst({
            where: {
              organizationId,
              itemId: line.itemId,
              batchNumber: line.batchNumber,
            },
          });
          if (batch) {
            await StockAvailabilityService.assertAvailable(
              organizationId,
              line.itemId,
              receipt.targetLocationId,
              Number(line.quantity),
              batch.id
            );
          }
        }

        const movement = await tx.stockMovement.findFirst({
          where: {
            organizationId,
            sourceDocumentId: id,
            sourceDocumentType: 'PurchaseReceipt',
            status: MovementStatus.POSTED,
          },
        });

        if (movement) {
          await StockLedgerService.cancelMovement(organizationId, movement.id, tx);
        }
      }

      // Transition state
      const updatedReceipt = await tx.purchaseReceipt.update({
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
          entityType: 'PurchaseReceipt',
          entityId: id,
          newValue: { status: DocumentStatus.CANCELLED },
        },
        tx
      );

      return updatedReceipt;
    });
  }

  /**
   * Find a Purchase Receipt by ID.
   */
  public static async findById(organizationId: string, id: string) {
    const receipt = await prisma.purchaseReceipt.findFirst({
      where: { id, organizationId },
      include: {
        lines: {
          include: {
            item: true,
            unit: true,
          },
        },
        supplier: true,
        targetLocation: true,
      },
    });

    if (!receipt) {
      throw new NotFoundError(`Purchase receipt not found with ID ${id}`);
    }

    return receipt;
  }

  /**
   * List Purchase Receipts.
   */
  public static async list(organizationId: string, query: PurchaseReceiptQuery) {
    const { page = 1, pageSize = 20, status, supplierId } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PurchaseReceiptWhereInput = {
      organizationId,
    };

    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    const [total, data] = await Promise.all([
      prisma.purchaseReceipt.count({ where }),
      prisma.purchaseReceipt.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: {
            select: { id: true, name: true },
          },
          targetLocation: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return { total, data };
  }
}
export default PurchaseReceiptsService;
