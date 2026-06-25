import { prisma } from '../../db/prisma';
import { runInTransaction } from '../../shared/db/transaction';
import { NotFoundError, ValidationError, ConflictError } from '../../shared/errors/app-error';
import { DocumentNumberService } from '../documents/document-number.service';
import { DocumentLifecycleService } from '../documents/document-lifecycle.service';
import { StockLedgerService } from '../stock/stock-ledger.service';
import { StockAvailabilityService } from '../stock/stock-availability.service';
import { BatchResolverService } from '../stock/batch-resolver.service';
import { AuditLogService } from '../audit/audit-log.service';
import { BOMLine, BatchStatus, MovementStatus, MovementType, ProductionStatus, Prisma } from '@prisma/client';
import { resolveWorkflowUserId } from '../../shared/auth/workflow-user';
import {
  CompleteProductionOrderInput,
  CreateProductionOrderInput,
  ProductionOrderQuery,
  UpdateProductionOrderInput,
} from './production-orders.schemas';

export class ProductionOrdersService {
  /**
   * Create a new Production Order in PLANNED state.
   */
  public static async create(organizationId: string, userId: string | undefined, data: CreateProductionOrderInput) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const orderNumber = await DocumentNumberService.generateNextNumber(
        organizationId,
        'PRD',
        tx
      );

      // Validate target item exists
      const targetItem = await tx.item.findFirst({
        where: { id: data.targetItemId, organizationId },
      });
      if (!targetItem) {
        throw new NotFoundError(`Target item ID ${data.targetItemId} not found`);
      }
      if (!targetItem.isActive) {
        throw new ValidationError(`Target item "${targetItem.name}" is inactive`);
      }

      // Validate target unit exists
      const targetUnit = await tx.unit.findFirst({
        where: {
          id: data.targetUnitId,
          OR: [{ organizationId }, { organizationId: null }],
        },
      });
      if (!targetUnit) {
        throw new NotFoundError(`Target unit ID ${data.targetUnitId} not found`);
      }

      // Validate workshop location
      const location = await tx.stockLocation.findFirst({
        where: { id: data.workshopLocationId, organizationId },
      });
      if (!location) {
        throw new NotFoundError(`Workshop location ID ${data.workshopLocationId} not found`);
      }
      if (!location.isActive) {
        throw new ValidationError(`Workshop location "${location.name}" is inactive`);
      }
      if (location.type !== 'WORKSHOP') {
        throw new ValidationError(`Workshop location must have type WORKSHOP, but got ${location.type}`);
      }

      // Validate BOM if provided, or auto-resolve active BOM for target item
      let bomLines: BOMLine[] = [];
      let resolvedBomId = data.bomId || null;
      if (resolvedBomId) {
        const bom = await tx.bOM.findFirst({
          where: { id: resolvedBomId, organizationId },
          include: { lines: true },
        });
        if (!bom) {
          throw new NotFoundError(`BOM with ID ${resolvedBomId} not found`);
        }
        if (!bom.isActive) {
          throw new ValidationError(`BOM with ID ${resolvedBomId} is inactive`);
        }
        if (bom.outputItemId !== data.targetItemId) {
          throw new ConflictError(`BOM output item ${bom.outputItemId} does not match production target item ${data.targetItemId}`);
        }
        bomLines = bom.lines;
      } else {
        const activeBoms = await tx.bOM.findMany({
          where: { outputItemId: data.targetItemId, isActive: true, organizationId },
          include: { lines: true },
        });
        if (activeBoms.length > 1) {
          throw new ConflictError(
            `Multiple active BOMs found for output item ${data.targetItemId}. Deactivate duplicates or pass bomId explicitly.`
          );
        }
        const activeBom = activeBoms[0];
        if (activeBom) {
          resolvedBomId = activeBom.id;
          bomLines = activeBom.lines;
        }
      }

      // Create production order
      const order = await tx.productionOrder.create({
        data: {
          organizationId,
          orderNumber,
          targetItemId: data.targetItemId,
          plannedQuantity: data.plannedQuantity,
          targetUnitId: data.targetUnitId,
          bomId: resolvedBomId,
          workshopLocationId: data.workshopLocationId,
          status: ProductionStatus.PLANNED,
          scheduledDate: new Date(data.scheduledDate),
          createdByUserId: effectiveUserId,
          plannedLines: {
            create: bomLines.map((line) => ({
              inputItemId: line.inputItemId,
              plannedQuantity: Number(line.quantity) * data.plannedQuantity,
              unitId: line.unitId,
            })),
          },
        },
        include: {
          plannedLines: true,
        },
      });

      return order;
    });
  }

  /**
   * Update a draft Production Order in PLANNED state.
   */
  public static async update(organizationId: string, id: string, data: UpdateProductionOrderInput) {
    return runInTransaction(async (tx) => {
      const order = await tx.productionOrder.findFirst({
        where: { id, organizationId },
      });

      if (!order) {
        throw new NotFoundError(`Production order not found with ID ${id}`);
      }

      if (order.status !== ProductionStatus.PLANNED) {
        throw new ValidationError(`Cannot update production order. Current status is ${order.status} (expected PLANNED)`);
      }

      const finalWorkshopLocId = data.workshopLocationId || order.workshopLocationId;
      if (data.workshopLocationId) {
        const location = await tx.stockLocation.findFirst({
          where: { id: data.workshopLocationId, organizationId },
        });
        if (!location) {
          throw new NotFoundError(`Workshop location ID ${data.workshopLocationId} not found`);
        }
        if (!location.isActive) {
          throw new ValidationError(`Workshop location "${location.name}" is inactive`);
        }
        if (location.type !== 'WORKSHOP') {
          throw new ValidationError(`Workshop location must have type WORKSHOP, but got ${location.type}`);
        }
      }

      const updateData: Prisma.ProductionOrderUncheckedUpdateInput = {};
      if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
      if (data.plannedQuantity) updateData.plannedQuantity = data.plannedQuantity;
      if (data.workshopLocationId) updateData.workshopLocationId = data.workshopLocationId;

      // Handle BOM change
      const finalBomId = data.bomId === undefined ? order.bomId : data.bomId;
      if (data.bomId !== undefined) {
        updateData.bomId = data.bomId;
      }

      const quantityChanged = data.plannedQuantity && data.plannedQuantity !== Number(order.plannedQuantity);
      const bomChanged = data.bomId !== undefined && data.bomId !== order.bomId;

      if (bomChanged || (quantityChanged && finalBomId)) {
        // Delete old planned lines
        await tx.productionOrderLine.deleteMany({
          where: { productionOrderId: id },
        });

        if (finalBomId) {
          const bom = await tx.bOM.findFirst({
            where: { id: finalBomId, organizationId },
            include: { lines: true },
          });
          if (!bom) {
            throw new NotFoundError(`BOM with ID ${finalBomId} not found`);
          }
          if (!bom.isActive) {
            throw new ValidationError(`BOM with ID ${finalBomId} is inactive`);
          }
          if (bom.outputItemId !== order.targetItemId) {
            throw new ConflictError(`BOM output item ${bom.outputItemId} does not match production target item ${order.targetItemId}`);
          }

          const targetPlannedQuantity = data.plannedQuantity || Number(order.plannedQuantity);

          updateData.plannedLines = {
            create: bom.lines.map((line) => ({
              inputItemId: line.inputItemId,
              plannedQuantity: Number(line.quantity) * targetPlannedQuantity,
              unitId: line.unitId,
            })),
          };
        }
      }

      return tx.productionOrder.update({
        where: { id },
        data: updateData,
        include: {
          plannedLines: true,
        },
      });
    });
  }

  /**
   * Start a production order (status -> IN_PROGRESS).
   */
  public static async start(organizationId: string, id: string, userId: string | undefined) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const order = await tx.productionOrder.findFirst({
        where: { id, organizationId },
      });

      if (!order) {
        throw new NotFoundError(`Production order not found with ID ${id}`);
      }

      if (order.status !== ProductionStatus.PLANNED) {
        throw new ValidationError(`Cannot start production order. Current status is ${order.status} (expected PLANNED)`);
      }

      const updated = await tx.productionOrder.update({
        where: { id },
        data: {
          status: ProductionStatus.IN_PROGRESS,
          actualStartDate: new Date(),
        },
      });

      await AuditLogService.recordAction(
        {
          organizationId,
          userId: effectiveUserId,
          action: 'START',
          entityType: 'ProductionOrder',
          entityId: id,
          newValue: { status: ProductionStatus.IN_PROGRESS },
        },
        tx
      );

      return updated;
    });
  }

  /**
   * Complete a production order (status -> COMPLETED).
   * Records material consumption and finished goods output.
   */
  public static async complete(organizationId: string, id: string, userId: string | undefined, data: CompleteProductionOrderInput) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const order = await tx.productionOrder.findFirst({
        where: { id, organizationId },
      });

      if (!order) {
        throw new NotFoundError(`Production order not found with ID ${id}`);
      }

      if (order.status !== ProductionStatus.PLANNED && order.status !== ProductionStatus.IN_PROGRESS) {
        throw new ValidationError(`Cannot complete production order. Current status is ${order.status} (expected PLANNED or IN_PROGRESS)`);
      }

      // Validate production location exists
      const location = await tx.stockLocation.findFirst({
        where: { id: data.productionLocationId, organizationId },
      });
      if (!location) {
        throw new NotFoundError(`Production location ID ${data.productionLocationId} not found`);
      }
      if (!location.isActive) {
        throw new ValidationError(`Production location "${location.name}" is inactive`);
      }

      // Determine material consumption
      const resolvedConsumptionLines: {
        itemId: string;
        quantity: number;
        unitId: string;
        batchId: string;
      }[] = [];

      if (data.consumptionLines && data.consumptionLines.length > 0) {
        // Use explicit consumption lines
        for (const line of data.consumptionLines) {
          // Check item and unit
          const item = await tx.item.findFirst({ where: { id: line.itemId, organizationId } });
          if (!item) throw new NotFoundError(`Consumed item ID ${line.itemId} not found`);
          const unit = await tx.unit.findFirst({ where: { id: line.unitId, OR: [{ organizationId }, { organizationId: null }] } });
          if (!unit) throw new NotFoundError(`Consumed unit ID ${line.unitId} not found`);

          if (line.batchId) {
            // Verify batch
            const batch = await tx.stockBatch.findFirst({ where: { id: line.batchId, itemId: line.itemId, organizationId } });
            if (!batch) throw new NotFoundError(`Stock batch ID ${line.batchId} not found for item ${line.itemId}`);
            resolvedConsumptionLines.push({
              itemId: line.itemId,
              quantity: line.quantity,
              unitId: line.unitId,
              batchId: line.batchId,
            });
          } else {
            // Resolve using batch resolver (FIFO)
            const allocations = await BatchResolverService.resolveBatches(
              organizationId,
              line.itemId,
              order.workshopLocationId,
              line.quantity,
              'FIFO'
            );
            for (const alloc of allocations) {
              resolvedConsumptionLines.push({
                itemId: line.itemId,
                quantity: alloc.quantity,
                unitId: line.unitId,
                batchId: alloc.batchId,
              });
            }
          }
        }
      } else {
        // Fall back to BOM lines
        if (!order.bomId) {
          throw new ValidationError('Material consumption cannot be determined: no explicit consumption lines provided and no BOM is linked to the production order.');
        }

        const bom = await tx.bOM.findFirst({
          where: { id: order.bomId, organizationId },
          include: { lines: true },
        });

        if (!bom) {
          throw new NotFoundError(`BOM with ID ${order.bomId} not found`);
        }

        if (!bom.isActive) {
          throw new ValidationError(`BOM with ID ${order.bomId} is inactive`);
        }

        if (bom.outputItemId !== order.targetItemId) {
          throw new ValidationError(`BOM output item ${bom.outputItemId} does not match production target item ${order.targetItemId}`);
        }

        for (const bomLine of bom.lines) {
          const qtyPerUnit = Number(bomLine.quantity);
          const wastePercent = bomLine.wastePercent ? Number(bomLine.wastePercent) : 0;
          const requiredQty = qtyPerUnit * data.actualQuantity * (1 + wastePercent / 100);

          // Resolve using batch resolver (FIFO)
          const allocations = await BatchResolverService.resolveBatches(
            organizationId,
            bomLine.inputItemId,
            order.workshopLocationId,
            requiredQty,
            'FIFO'
          );

          for (const alloc of allocations) {
            resolvedConsumptionLines.push({
              itemId: bomLine.inputItemId,
              quantity: alloc.quantity,
              unitId: bomLine.unitId,
              batchId: alloc.batchId,
            });
          }
        }
      }

      // Assert stock availability for all resolved consumption lines
      for (const line of resolvedConsumptionLines) {
        await StockAvailabilityService.assertAvailable(
          organizationId,
          line.itemId,
          order.workshopLocationId,
          line.quantity,
          line.batchId
        );
      }

      // Find or create StockBatch for the produced output item
      let outputBatch = await tx.stockBatch.findFirst({
        where: {
          organizationId,
          itemId: order.targetItemId,
          batchNumber: data.outputBatchNumber,
        },
      });

      if (!outputBatch) {
        outputBatch = await tx.stockBatch.create({
          data: {
            organizationId,
            itemId: order.targetItemId,
            batchNumber: data.outputBatchNumber,
            unitId: order.targetUnitId,
            receivedLocationId: data.productionLocationId,
            receivedDate: new Date(),
            expirationDate: data.outputExpirationDate ? new Date(data.outputExpirationDate) : null,
            status: BatchStatus.APPROVED,
          },
        });
      }

      const timestamp = new Date();

      // Create PRODUCTION_CONSUMPTION movements (negative quantities -> sourceLocationId populated, targetLocationId null)
      const consumptionMovementLines = resolvedConsumptionLines.map((line) => ({
        itemId: line.itemId,
        batchId: line.batchId,
        quantity: line.quantity, // StockLedgerService expects positive, sourceLocationId does the deduction
        unitId: line.unitId,
        sourceLocationId: order.workshopLocationId,
        targetLocationId: null,
      }));

      const consumptionMovement = await StockLedgerService.createMovementDraft(
        organizationId,
        {
          type: MovementType.PRODUCTION_CONSUMPTION,
          sourceDocumentType: 'ProductionOrder',
          sourceDocumentId: order.id,
          createdByUserId: effectiveUserId,
          timestamp,
          lines: consumptionMovementLines,
        },
        tx
      );

      await StockLedgerService.postMovement(organizationId, consumptionMovement.id, effectiveUserId, tx);

      // Create PRODUCTION_OUTPUT movements (positive quantity -> targetLocationId populated, sourceLocationId null)
      const outputMovement = await StockLedgerService.createMovementDraft(
        organizationId,
        {
          type: MovementType.PRODUCTION_OUTPUT,
          sourceDocumentType: 'ProductionOrder',
          sourceDocumentId: order.id,
          createdByUserId: effectiveUserId,
          timestamp,
          lines: [
            {
              itemId: order.targetItemId,
              batchId: outputBatch.id,
              quantity: data.actualQuantity,
              unitId: order.targetUnitId,
              sourceLocationId: null,
              targetLocationId: data.productionLocationId,
            },
          ],
        },
        tx
      );

      await StockLedgerService.postMovement(organizationId, outputMovement.id, effectiveUserId, tx);

      // Write ProductionConsumption and FinishedGoodsOutput DB records
      await tx.productionConsumption.createMany({
        data: resolvedConsumptionLines.map((line) => ({
          organizationId,
          productionOrderId: order.id,
          itemId: line.itemId,
          batchId: line.batchId,
          quantity: line.quantity,
          unitId: line.unitId,
          sourceLocationId: order.workshopLocationId,
          consumedByUserId: effectiveUserId,
          timestamp,
        })),
      });

      await tx.finishedGoodsOutput.create({
        data: {
          organizationId,
          productionOrderId: order.id,
          itemId: order.targetItemId,
          batchId: outputBatch.id,
          quantity: data.actualQuantity,
          unitId: order.targetUnitId,
          targetLocationId: data.productionLocationId,
          producedByUserId: effectiveUserId,
          timestamp,
        },
      });

      // Update ProductionOrder details
      const updatedOrder = await tx.productionOrder.update({
        where: { id },
        data: {
          status: ProductionStatus.COMPLETED,
          actualQuantity: data.actualQuantity,
          completedAt: timestamp,
          actualEndDate: timestamp,
        },
      });

      // Audit Log
      await AuditLogService.recordAction(
        {
          organizationId,
          userId: effectiveUserId,
          action: 'COMPLETE',
          entityType: 'ProductionOrder',
          entityId: id,
          newValue: { status: ProductionStatus.COMPLETED, actualQuantity: data.actualQuantity },
        },
        tx
      );

      return updatedOrder;
    });
  }

  /**
   * Cancel a Production Order.
   */
  public static async cancel(organizationId: string, id: string, userId: string | undefined) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const order = await tx.productionOrder.findFirst({
        where: { id, organizationId },
        include: { outputs: true },
      });

      if (!order) {
        throw new NotFoundError(`Production order not found with ID ${id}`);
      }

      if (order.status === ProductionStatus.CANCELLED) {
        throw new ValidationError('Production order is already CANCELLED');
      }

      if (order.status === ProductionStatus.COMPLETED) {
        // Verify availability of finished goods to reverse output
        for (const output of order.outputs) {
          if (output.batchId) {
            await StockAvailabilityService.assertAvailable(
              organizationId,
              output.itemId,
              output.targetLocationId,
              Number(output.quantity),
              output.batchId
            );
          }
        }

        // Find and cancel all posted movements for this order
        const movements = await tx.stockMovement.findMany({
          where: {
            organizationId,
            sourceDocumentId: id,
            sourceDocumentType: 'ProductionOrder',
            status: MovementStatus.POSTED,
          },
        });

        for (const movement of movements) {
          await StockLedgerService.cancelMovement(organizationId, movement.id, tx);
        }
      }

      const updated = await tx.productionOrder.update({
        where: { id },
        data: {
          status: ProductionStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      await AuditLogService.recordAction(
        {
          organizationId,
          userId: effectiveUserId,
          action: 'CANCEL',
          entityType: 'ProductionOrder',
          entityId: id,
          newValue: { status: ProductionStatus.CANCELLED },
        },
        tx
      );

      return updated;
    });
  }

  /**
   * Get production order details by ID.
   */
  public static async findById(organizationId: string, id: string) {
    const order = await prisma.productionOrder.findFirst({
      where: { id, organizationId },
      include: {
        plannedLines: {
          include: {
            inputItem: true,
            unit: true,
          },
        },
        consumptions: {
          include: {
            item: true,
            unit: true,
            batch: true,
          },
        },
        outputs: {
          include: {
            item: true,
            unit: true,
            batch: true,
          },
        },
        targetItem: true,
        targetUnit: true,
        workshopLocation: true,
      },
    });

    if (!order) {
      throw new NotFoundError(`Production order not found with ID ${id}`);
    }

    return order;
  }

  /**
   * List production orders.
   */
  public static async list(organizationId: string, query: ProductionOrderQuery) {
    const { page = 1, pageSize = 20, status } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductionOrderWhereInput = {
      organizationId,
    };

    if (status) where.status = status;

    const [total, data] = await Promise.all([
      prisma.productionOrder.count({ where }),
      prisma.productionOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          targetItem: { select: { id: true, name: true } },
          workshopLocation: { select: { id: true, name: true } },
        },
      }),
    ]);

    return { total, data };
  }
}
export default ProductionOrdersService;
