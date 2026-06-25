import { prisma } from '../../db/prisma';
import { runInTransaction } from '../../shared/db/transaction';
import { NotFoundError, ValidationError } from '../../shared/errors/app-error';
import { DocumentNumberService } from '../documents/document-number.service';
import { DocumentLifecycleService } from '../documents/document-lifecycle.service';
import { StockLedgerService } from '../stock/stock-ledger.service';
import { StockAvailabilityService } from '../stock/stock-availability.service';
import { AuditLogService } from '../audit/audit-log.service';
import { ShipmentStatus, MovementStatus, MovementType, Prisma } from '@prisma/client';
import { resolveWorkflowUserId } from '../../shared/auth/workflow-user';
import {
  CreateShipmentInput,
  ShipmentQuery,
  UpdateShipmentInput,
} from './shipments.schemas';

export class ShipmentsService {
  /**
   * Create a new Shipment in DRAFT state.
   */
  public static async create(organizationId: string, userId: string | undefined, data: CreateShipmentInput) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const shipmentNumber = await DocumentNumberService.generateNextNumber(
        organizationId,
        'SHP',
        tx
      );

      // Validate customer scope if provided
      if (data.customerId) {
        const customer = await tx.customer.findFirst({
          where: { id: data.customerId, organizationId },
        });
        if (!customer) {
          throw new NotFoundError(`Customer ID ${data.customerId} not found`);
        }
      }

      // Validate shipment location
      const location = await tx.stockLocation.findFirst({
        where: { id: data.sourceLocationId, organizationId },
      });
      if (!location) {
        throw new NotFoundError(`Shipment location ID ${data.sourceLocationId} not found`);
      }
      if (!location.isActive) {
        throw new ValidationError(`Shipment location "${location.name}" is inactive`);
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
            OR: [{ organizationId }, { organizationId: null }],
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

      const shipment = await tx.shipment.create({
        data: {
          organizationId,
          shipmentNumber,
          date: new Date(data.date),
          customerId: data.customerId || null,
          sourceLocationId: data.sourceLocationId,
          status: ShipmentStatus.DRAFT,
          createdByUserId: effectiveUserId,
          lines: {
            create: data.lines.map((line) => ({
              itemId: line.itemId,
              quantity: line.quantity,
              unitId: line.unitId,
              pricePerUnit: line.pricePerUnit || null,
              batchId: line.batchId || null,
            })),
          },
        },
        include: {
          lines: true,
        },
      });

      return shipment;
    });
  }

  /**
   * Update a draft Shipment.
   */
  public static async update(organizationId: string, id: string, data: UpdateShipmentInput) {
    return runInTransaction(async (tx) => {
      const shipment = await tx.shipment.findFirst({
        where: { id, organizationId },
      });

      if (!shipment) {
        throw new NotFoundError(`Shipment not found with ID ${id}`);
      }

      if (shipment.status !== ShipmentStatus.DRAFT) {
        throw new ValidationError(`Cannot update shipment. Current status is ${shipment.status} (expected DRAFT)`);
      }

      // Validate location if changed
      if (data.sourceLocationId) {
        const location = await tx.stockLocation.findFirst({
          where: { id: data.sourceLocationId, organizationId },
        });
        if (!location) {
          throw new NotFoundError(`Shipment location ID ${data.sourceLocationId} not found`);
        }
        if (!location.isActive) {
          throw new ValidationError(`Shipment location "${location.name}" is inactive`);
        }
      }

      // Validate customer if changed
      if (data.customerId) {
        const customer = await tx.customer.findFirst({
          where: { id: data.customerId, organizationId },
        });
        if (!customer) {
          throw new NotFoundError(`Customer ID ${data.customerId} not found`);
        }
      }

      const updateData: Prisma.ShipmentUncheckedUpdateInput = {};
      if (data.date) updateData.date = new Date(data.date);
      if (data.customerId !== undefined) updateData.customerId = data.customerId;
      if (data.sourceLocationId) updateData.sourceLocationId = data.sourceLocationId;

      if (data.lines) {
        // Delete old lines
        await tx.shipmentLine.deleteMany({
          where: { shipmentId: id },
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
              OR: [{ organizationId }, { organizationId: null }],
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
            pricePerUnit: line.pricePerUnit || null,
            batchId: line.batchId || null,
          })),
        };
      }

      return tx.shipment.update({
        where: { id },
        data: updateData,
        include: {
          lines: true,
        },
      });
    });
  }

  /**
   * Post/Ship a Shipment (status -> SHIPPED).
   */
  public static async ship(organizationId: string, id: string, userId: string | undefined) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const shipment = await tx.shipment.findFirst({
        where: { id, organizationId },
        include: { lines: true },
      });

      if (!shipment) {
        throw new NotFoundError(`Shipment not found with ID ${id}`);
      }

      if (shipment.status !== ShipmentStatus.DRAFT) {
        throw new ValidationError(`Cannot ship. Current status is ${shipment.status} (expected DRAFT)`);
      }

      const movementLines = [];

      for (const line of shipment.lines) {
        // Assert stock availability at source location (optionally scoped by batch)
        await StockAvailabilityService.assertAvailable(
          organizationId,
          line.itemId,
          shipment.sourceLocationId,
          Number(line.quantity),
          line.batchId
        );

        movementLines.push({
          itemId: line.itemId,
          batchId: line.batchId,
          quantity: Number(line.quantity), // Absolute value
          unitId: line.unitId,
          sourceLocationId: shipment.sourceLocationId, // Outgoing from location
          targetLocationId: null, // Virtual target
          costPerUnit: line.pricePerUnit ? Number(line.pricePerUnit) : null,
        });
      }

      // Create and post stock movement
      const movement = await StockLedgerService.createMovementDraft(
        organizationId,
        {
          type: MovementType.SHIPMENT,
          sourceDocumentType: 'Shipment',
          sourceDocumentId: shipment.id,
          createdByUserId: effectiveUserId,
          timestamp: shipment.date,
          lines: movementLines,
        },
        tx
      );

      await StockLedgerService.postMovement(organizationId, movement.id, effectiveUserId, tx);

      // Transition document status
      const updatedShipment = await tx.shipment.update({
        where: { id },
        data: {
          status: ShipmentStatus.SHIPPED,
          shippedAt: new Date(),
        },
        include: { lines: true },
      });

      // Audit Log
      await AuditLogService.recordAction(
        {
          organizationId,
          userId: effectiveUserId,
          action: 'SHIP',
          entityType: 'Shipment',
          entityId: shipment.id,
          newValue: { status: ShipmentStatus.SHIPPED },
        },
        tx
      );

      return updatedShipment;
    });
  }

  /**
   * Cancel a Shipment.
   */
  public static async cancel(organizationId: string, id: string, userId: string | undefined) {
    return runInTransaction(async (tx) => {
      const effectiveUserId = await resolveWorkflowUserId(tx, userId);
      const shipment = await tx.shipment.findFirst({
        where: { id, organizationId },
      });

      if (!shipment) {
        throw new NotFoundError(`Shipment not found with ID ${id}`);
      }

      if (shipment.status === ShipmentStatus.CANCELLED) {
        throw new ValidationError('Shipment is already CANCELLED');
      }

      // If document was shipped, neutralize its stock movements
      if (shipment.status === ShipmentStatus.SHIPPED) {
        const movement = await tx.stockMovement.findFirst({
          where: {
            organizationId,
            sourceDocumentId: id,
            sourceDocumentType: 'Shipment',
            status: MovementStatus.POSTED,
          },
        });

        if (movement) {
          await StockLedgerService.cancelMovement(organizationId, movement.id, tx);
        }
      }

      const updatedShipment = await tx.shipment.update({
        where: { id },
        data: {
          status: ShipmentStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      // Audit Log
      await AuditLogService.recordAction(
        {
          organizationId,
          userId: effectiveUserId,
          action: 'CANCEL',
          entityType: 'Shipment',
          entityId: id,
          newValue: { status: ShipmentStatus.CANCELLED },
        },
        tx
      );

      return updatedShipment;
    });
  }

  /**
   * Find a Shipment by ID.
   */
  public static async findById(organizationId: string, id: string) {
    const shipment = await prisma.shipment.findFirst({
      where: { id, organizationId },
      include: {
        lines: {
          include: {
            item: true,
            unit: true,
            batch: true,
          },
        },
        customer: true,
        sourceLocation: true,
      },
    });

    if (!shipment) {
      throw new NotFoundError(`Shipment not found with ID ${id}`);
    }

    return shipment;
  }

  /**
   * List Shipments.
   */
  public static async list(organizationId: string, query: ShipmentQuery) {
    const { page = 1, pageSize = 20, status } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ShipmentWhereInput = {
      organizationId,
    };

    if (status) where.status = status;

    const [total, data] = await Promise.all([
      prisma.shipment.count({ where }),
      prisma.shipment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          sourceLocation: { select: { id: true, name: true } },
        },
      }),
    ]);

    return { total, data };
  }
}
export default ShipmentsService;
