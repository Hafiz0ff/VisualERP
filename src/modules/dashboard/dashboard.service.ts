import { prisma } from '../../db/prisma';
import {
  MovementStatus,
  ProductionStatus,
  ShipmentStatus,
  DocumentStatus,
  InventoryAuditStatus,
} from '@prisma/client';

export class DashboardService {
  /**
   * Generates dashboard statistics and analytics for the specified organization.
   */
  public static async getDashboardData(organizationId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Stock Summary (Derived dynamically from posted movements)
    const movementLines = await prisma.stockMovementLine.findMany({
      where: {
        stockMovement: {
          organizationId,
          status: MovementStatus.POSTED,
        },
      },
      select: {
        itemId: true,
        batchId: true,
        quantity: true,
        sourceLocationId: true,
        targetLocationId: true,
        item: {
          select: {
            itemType: true,
          },
        },
      },
    });

    const locBalances = new Map<string, { quantity: number; itemType: string }>(); // key: `itemId:locationId`
    const batchLocBalances = new Map<string, number>(); // key: `itemId:locationId:batchId`

    for (const line of movementLines) {
      const qty = Number(line.quantity);
      const itemType = line.item.itemType;

      if (line.sourceLocationId) {
        const key = `${line.itemId}:${line.sourceLocationId}`;
        const current = locBalances.get(key);
        locBalances.set(key, {
          quantity: (current?.quantity || 0) - qty,
          itemType,
        });

        if (line.batchId) {
          const bkey = `${line.itemId}:${line.sourceLocationId}:${line.batchId}`;
          batchLocBalances.set(bkey, (batchLocBalances.get(bkey) || 0) - qty);
        }
      }

      if (line.targetLocationId) {
        const key = `${line.itemId}:${line.targetLocationId}`;
        const current = locBalances.get(key);
        locBalances.set(key, {
          quantity: (current?.quantity || 0) + qty,
          itemType,
        });

        if (line.batchId) {
          const bkey = `${line.itemId}:${line.targetLocationId}:${line.batchId}`;
          batchLocBalances.set(bkey, (batchLocBalances.get(bkey) || 0) + qty);
        }
      }
    }

    const positiveItems = new Set<string>();
    const positiveLocations = new Set<string>();
    const positiveBatches = new Set<string>();
    const qtyByType: Record<string, number> = {};

    for (const [key, balance] of locBalances.entries()) {
      if (balance.quantity > 0) {
        const [itemId, locationId] = key.split(':');
        positiveItems.add(itemId);
        positiveLocations.add(locationId);
        qtyByType[balance.itemType] = (qtyByType[balance.itemType] || 0) + balance.quantity;
      }
    }

    for (const [key, bal] of batchLocBalances.entries()) {
      if (bal > 0) {
        const [, , batchId] = key.split(':');
        positiveBatches.add(batchId);
      }
    }

    const stockSummary = {
      totalStockItems: positiveItems.size,
      totalStockLocations: positiveLocations.size,
      totalStockBatches: positiveBatches.size,
      totalQtyByType: qtyByType,
    };

    // 2. Low Stock Items (Empty array as minimum stock is not modeled in the database schema)
    const lowStockItems: [] = [];

    // 3. Production Summary
    const productionStatusCounts = await prisma.productionOrder.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: { organizationId },
    });
    const productionByStatus: Record<string, number> = {
      PLANNED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const c of productionStatusCounts) {
      productionByStatus[c.status] = c._count._all;
    }

    const completedCurrentMonthCount = await prisma.productionOrder.count({
      where: {
        organizationId,
        status: ProductionStatus.COMPLETED,
        completedAt: {
          gte: startOfMonth,
        },
      },
    });

    const latestCompletedProduction = await prisma.productionOrder.findMany({
      where: {
        organizationId,
        status: ProductionStatus.COMPLETED,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 5,
      include: {
        targetItem: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    const productionSummary = {
      byStatus: productionByStatus,
      completedCurrentMonthCount,
      latestCompleted: latestCompletedProduction.map((po) => ({
        id: po.id,
        orderNumber: po.orderNumber,
        targetItemId: po.targetItemId,
        targetItemName: po.targetItem.name,
        targetItemCode: po.targetItem.code,
        actualQuantity: po.actualQuantity ? Number(po.actualQuantity) : null,
        completedAt: po.completedAt,
      })),
    };

    // 4. Shipment Summary
    const shipmentStatusCounts = await prisma.shipment.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: { organizationId },
    });
    const shipmentByStatus: Record<string, number> = {
      DRAFT: 0,
      SHIPPED: 0,
      CANCELLED: 0,
    };
    for (const c of shipmentStatusCounts) {
      shipmentByStatus[c.status] = c._count._all;
    }

    const shippedCurrentMonthCount = await prisma.shipment.count({
      where: {
        organizationId,
        status: ShipmentStatus.SHIPPED,
        shippedAt: {
          gte: startOfMonth,
        },
      },
    });

    const latestShippedShipments = await prisma.shipment.findMany({
      where: {
        organizationId,
        status: ShipmentStatus.SHIPPED,
      },
      orderBy: {
        shippedAt: 'desc',
      },
      take: 5,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const shipmentSummary = {
      byStatus: shipmentByStatus,
      shippedCurrentMonthCount,
      latestShipped: latestShippedShipments.map((s) => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        customerId: s.customerId,
        customerName: s.customer?.name || null,
        shippedAt: s.shippedAt,
      })),
    };

    // 5. Write-off Summary
    const writeOffStatusCounts = await prisma.writeOff.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: { organizationId },
    });
    const writeOffByStatus: Record<string, number> = {
      DRAFT: 0,
      POSTED: 0,
      CANCELLED: 0,
    };
    for (const c of writeOffStatusCounts) {
      writeOffByStatus[c.status] = c._count._all;
    }

    const postedWriteOffsCount = await prisma.writeOff.count({
      where: {
        organizationId,
        status: DocumentStatus.POSTED,
        postedAt: {
          gte: startOfMonth,
        },
      },
    });

    const writeOffReasonCounts = await prisma.writeOff.groupBy({
      by: ['reason'],
      _count: { _all: true },
      where: {
        organizationId,
        status: DocumentStatus.POSTED,
      },
    });
    const writeOffByReason: Record<string, number> = {};
    for (const c of writeOffReasonCounts) {
      writeOffByReason[c.reason] = c._count._all;
    }

    const writeOffSummary = {
      byStatus: writeOffByStatus,
      postedCurrentMonthCount: postedWriteOffsCount,
      byReason: writeOffByReason,
    };

    // 6. Pending Documents
    const [
      draftPurchaseReceiptsCount,
      draftTransfersCount,
      plannedOrInProgressProductionOrdersCount,
      draftShipmentsCount,
      draftWriteOffsCount,
      countedInventoryAuditsCount,
    ] = await Promise.all([
      prisma.purchaseReceipt.count({
        where: { organizationId, status: DocumentStatus.DRAFT },
      }),
      prisma.transfer.count({
        where: { organizationId, status: DocumentStatus.DRAFT },
      }),
      prisma.productionOrder.count({
        where: {
          organizationId,
          status: {
            in: [ProductionStatus.PLANNED, ProductionStatus.IN_PROGRESS],
          },
        },
      }),
      prisma.shipment.count({
        where: { organizationId, status: ShipmentStatus.DRAFT },
      }),
      prisma.writeOff.count({
        where: { organizationId, status: DocumentStatus.DRAFT },
      }),
      prisma.inventoryAudit.count({
        where: { organizationId, status: InventoryAuditStatus.COUNTED },
      }),
    ]);

    const pendingDocuments = {
      draftPurchaseReceiptsCount,
      draftTransfersCount,
      plannedOrInProgressProductionOrdersCount,
      draftShipmentsCount,
      draftWriteOffsCount,
      countedInventoryAuditsCount,
    };

    // 7. Recent Audit Events
    const rawAuditLogs = await prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const recentAuditEvents = rawAuditLogs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      userId: log.userId,
      userEmail: log.user?.email || null,
      userFullName: log.user ? `${log.user.firstName} ${log.user.lastName}`.trim() : null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      summary: `${log.action} performed on ${log.entityType} (${log.entityId})`,
    }));

    return {
      stockSummary,
      lowStockItems,
      productionSummary,
      shipmentSummary,
      writeOffSummary,
      pendingDocuments,
      recentAuditEvents,
    };
  }
}
export default DashboardService;
