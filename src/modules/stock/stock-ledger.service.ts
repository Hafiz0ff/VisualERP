import { prisma } from '../../db/prisma';
import { TransactionClient } from '../../shared/db/transaction';
import { NotFoundError, ValidationError } from '../../shared/errors/app-error';
import {
  assertPositive,
  assertSameOrganization,
  assertUuid,
} from '../../shared/domain/domain-validation';
import { DocumentNumberService } from '../documents/document-number.service';
import { EventBus } from '../../shared/domain/event-bus';
import { createDomainEvent } from '../../shared/domain/domain-event';
import { CreateStockMovementInput } from './stock.types';
import { MovementStatus, Prisma } from '@prisma/client';
import { StockMovementListQuery } from './stock.types';

export class StockLedgerService {
  /**
   * Creates a draft stock movement with the associated lines.
   * Scopes and validates that items, locations, and units belong to the organization.
   */
  public static async createMovementDraft(
    organizationId: string,
    input: CreateStockMovementInput,
    tx?: TransactionClient
  ) {
    const client = tx || prisma;

    // Generate next sequential number for stock movements
    const movementNumber = await DocumentNumberService.generateNextNumber(
      organizationId,
      'MVT',
      tx
    );

    // Validate overall header parameters
    assertUuid(organizationId, 'organizationId');
    assertUuid(input.createdByUserId, 'createdByUserId');

    // Create movement inside database
    const movement = await client.stockMovement.create({
      data: {
        organizationId,
        movementNumber,
        type: input.type,
        status: MovementStatus.DRAFT,
        sourceDocumentType: input.sourceDocumentType,
        sourceDocumentId: input.sourceDocumentId,
        createdByUserId: input.createdByUserId,
        timestamp: input.timestamp,
        lines: {
          create: await Promise.all(
            input.lines.map(async (line) => {
              assertPositive(line.quantity, 'quantity');
              assertUuid(line.itemId, 'itemId');
              assertUuid(line.unitId, 'unitId');

              if (line.sourceLocationId) assertUuid(line.sourceLocationId, 'sourceLocationId');
              if (line.targetLocationId) assertUuid(line.targetLocationId, 'targetLocationId');
              if (line.batchId) assertUuid(line.batchId, 'batchId');

              if (!line.sourceLocationId && !line.targetLocationId) {
                throw new ValidationError('A stock movement line must specify at least a source or a target location');
              }

              if (line.sourceLocationId === line.targetLocationId) {
                throw new ValidationError('Source and target locations must be different');
              }

              // Verify item active status and organization scope
              const item = await client.item.findFirst({
                where: { id: line.itemId, organizationId },
              });
              if (!item) {
                throw new NotFoundError(`Item with ID ${line.itemId} not found in this organization`);
              }
              if (!item.isActive) {
                throw new ValidationError(`Item "${item.name}" is inactive and cannot be used in stock movements`);
              }

              // Verify locations active status and organization scope
              if (line.sourceLocationId) {
                const src = await client.stockLocation.findFirst({
                  where: { id: line.sourceLocationId, organizationId },
                });
                if (!src) {
                  throw new NotFoundError(`Source location ID ${line.sourceLocationId} not found in this organization`);
                }
                if (!src.isActive) {
                  throw new ValidationError(`Source location "${src.name}" is inactive`);
                }
              }
              if (line.targetLocationId) {
                const tgt = await client.stockLocation.findFirst({
                  where: { id: line.targetLocationId, organizationId },
                });
                if (!tgt) {
                  throw new NotFoundError(`Target location ID ${line.targetLocationId} not found in this organization`);
                }
                if (!tgt.isActive) {
                  throw new ValidationError(`Target location "${tgt.name}" is inactive`);
                }
              }

              // Verify unit organization scope
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
                throw new NotFoundError(`Unit with ID ${line.unitId} not found in this organization`);
              }

              // Verify batch organization scope if specified
              if (line.batchId) {
                const batch = await client.stockBatch.findFirst({
                  where: { id: line.batchId, itemId: line.itemId, organizationId },
                });
                if (!batch) {
                  throw new NotFoundError(`Stock batch with ID ${line.batchId} not found for item ${line.itemId} in this organization`);
                }
              }

              return {
                itemId: line.itemId,
                batchId: line.batchId || null,
                quantity: line.quantity,
                unitId: line.unitId,
                sourceLocationId: line.sourceLocationId || null,
                targetLocationId: line.targetLocationId || null,
                costPerUnit: line.costPerUnit || null,
              };
            })
          ),
        },
      },
      include: {
        lines: true,
      },
    });

    // Publish event
    const event = createDomainEvent('StockMovementCreated', organizationId, {
      movementId: movement.id,
      movementNumber,
    });
    await EventBus.publish(event, tx);

    return movement;
  }

  /**
   * Posts a draft stock movement, making it effective for stock balance calculations.
   */
  public static async postMovement(
    organizationId: string,
    movementId: string,
    postedByUserId: string,
    tx?: TransactionClient
  ) {
    const client = tx || prisma;

    const movement = await client.stockMovement.findFirst({
      where: { id: movementId, organizationId },
      include: { lines: true },
    });

    if (!movement) {
      throw new NotFoundError(`Stock movement not found with ID ${movementId}`);
    }

    if (movement.status !== MovementStatus.DRAFT) {
      throw new ValidationError(`Cannot post stock movement. Current status is ${movement.status} (expected DRAFT)`);
    }

    const updatedMovement = await client.stockMovement.update({
      where: { id: movementId },
      data: {
        status: MovementStatus.POSTED,
        postedByUserId,
        postedAt: new Date(),
      },
      include: { lines: true },
    });

    // Publish event
    const event = createDomainEvent('StockMovementPosted', organizationId, {
      movementId: updatedMovement.id,
      movementNumber: updatedMovement.movementNumber,
    });
    await EventBus.publish(event, tx);

    return updatedMovement;
  }

  /**
   * Cancels a posted stock movement, neutralizing its stock effects.
   */
  public static async cancelMovement(
    organizationId: string,
    movementId: string,
    tx?: TransactionClient
  ) {
    const client = tx || prisma;

    const movement = await client.stockMovement.findFirst({
      where: { id: movementId, organizationId },
    });

    if (!movement) {
      throw new NotFoundError(`Stock movement not found with ID ${movementId}`);
    }

    if (movement.status !== MovementStatus.POSTED) {
      throw new ValidationError(`Cannot cancel stock movement. Current status is ${movement.status} (expected POSTED)`);
    }

    const updatedMovement = await client.stockMovement.update({
      where: { id: movementId },
      data: {
        status: MovementStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // Publish event
    const event = createDomainEvent('StockMovementCancelled', organizationId, {
      movementId: updatedMovement.id,
      movementNumber: updatedMovement.movementNumber,
    });
    await EventBus.publish(event, tx);

    return updatedMovement;
  }

  /**
   * Retrieves a stock movement by ID.
   */
  public static async getMovementById(organizationId: string, id: string) {
    const movement = await prisma.stockMovement.findFirst({
      where: { id, organizationId },
      include: {
        lines: {
          include: {
            item: true,
            unit: true,
            sourceLocation: true,
            targetLocation: true,
            batch: true,
          },
        },
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        postedBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!movement) {
      throw new NotFoundError(`Stock movement not found with ID ${id}`);
    }

    return movement;
  }

  /**
   * Lists stock movements.
   */
  public static async listMovements(organizationId: string, query: StockMovementListQuery = {}) {
    const { page = 1, pageSize = 20, type, status, sourceDocumentId } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.StockMovementWhereInput = {
      organizationId,
    };

    if (type) where.type = type;
    if (status) where.status = status;
    if (sourceDocumentId) where.sourceDocumentId = sourceDocumentId;

    const [total, data] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          lines: {
            include: {
              item: true,
              unit: true,
            },
          },
        },
      }),
    ]);

    return { total, data };
  }

  /**
   * Calculates the current stock balance of a specific item in a specific location (optional batch).
   * Derived dynamically as the sum of target location quantities minus source location quantities for POSTED movements.
   */
  public static async calculateBalanceForItemLocation(
    organizationId: string,
    itemId: string,
    locationId: string,
    batchId?: string | null
  ): Promise<number> {
    const incoming = await prisma.stockMovementLine.aggregate({
      _sum: { quantity: true },
      where: {
        stockMovement: {
          organizationId,
          status: MovementStatus.POSTED,
        },
        itemId,
        targetLocationId: locationId,
        ...(batchId !== undefined ? { batchId } : {}),
      },
    });

    const outgoing = await prisma.stockMovementLine.aggregate({
      _sum: { quantity: true },
      where: {
        stockMovement: {
          organizationId,
          status: MovementStatus.POSTED,
        },
        itemId,
        sourceLocationId: locationId,
        ...(batchId !== undefined ? { batchId } : {}),
      },
    });

    const totalIn = incoming._sum.quantity ? Number(incoming._sum.quantity) : 0;
    const totalOut = outgoing._sum.quantity ? Number(outgoing._sum.quantity) : 0;

    return totalIn - totalOut;
  }

  /**
   * Calculates the stock balance of a specific item across all locations.
   */
  public static async calculateBalanceForItem(
    organizationId: string,
    itemId: string
  ): Promise<number> {
    const incoming = await prisma.stockMovementLine.aggregate({
      _sum: { quantity: true },
      where: {
        stockMovement: {
          organizationId,
          status: MovementStatus.POSTED,
        },
        itemId,
        targetLocationId: { not: null },
      },
    });

    const outgoing = await prisma.stockMovementLine.aggregate({
      _sum: { quantity: true },
      where: {
        stockMovement: {
          organizationId,
          status: MovementStatus.POSTED,
        },
        itemId,
        sourceLocationId: { not: null },
      },
    });

    const totalIn = incoming._sum.quantity ? Number(incoming._sum.quantity) : 0;
    const totalOut = outgoing._sum.quantity ? Number(outgoing._sum.quantity) : 0;

    return totalIn - totalOut;
  }

  /**
   * Calculates stock balance for a specific location across all items.
   * Returns list of item IDs with balances.
   */
  public static async calculateBalanceForLocation(
    organizationId: string,
    locationId: string
  ): Promise<{ itemId: string; quantity: number }[]> {
    const [incoming, outgoing] = await Promise.all([
      prisma.stockMovementLine.groupBy({
        by: ['itemId'],
        _sum: { quantity: true },
        where: {
          stockMovement: {
            organizationId,
            status: MovementStatus.POSTED,
          },
          targetLocationId: locationId,
        },
      }),
      prisma.stockMovementLine.groupBy({
        by: ['itemId'],
        _sum: { quantity: true },
        where: {
          stockMovement: {
            organizationId,
            status: MovementStatus.POSTED,
          },
          sourceLocationId: locationId,
        },
      }),
    ]);

    const balancesMap = new Map<string, number>();

    for (const record of incoming) {
      const qty = record._sum.quantity ? Number(record._sum.quantity) : 0;
      balancesMap.set(record.itemId, qty);
    }

    for (const record of outgoing) {
      const qty = record._sum.quantity ? Number(record._sum.quantity) : 0;
      const current = balancesMap.get(record.itemId) || 0;
      balancesMap.set(record.itemId, current - qty);
    }

    const balancesList: { itemId: string; quantity: number }[] = [];
    for (const [itemId, quantity] of balancesMap.entries()) {
      if (quantity !== 0) {
        balancesList.push({ itemId, quantity });
      }
    }

    return balancesList;
  }
}
export default StockLedgerService;
