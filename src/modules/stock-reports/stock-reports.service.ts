import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError } from '../../shared/errors/app-error';
import { StockLedgerService } from '../stock/stock-ledger.service';
import {
  StockBalanceByItemQuery,
  StockBalanceByLocationQuery,
  StockBalanceQuery,
  StockBatchQuery,
  StockMovementQuery,
} from './stock-reports.schemas';

interface StockBalanceRow {
  itemId: string;
  itemName: string;
  itemCode: string | null;
  itemType: string;
  locationId: string;
  locationName: string;
  batchId: string | null;
  batchNumber: string | null;
  unitName: string;
  unitSymbol: string;
  quantity: number;
}

interface ItemLocationBalance {
  locationId: string;
  locationName: string;
  quantity: number;
  batches: {
    batchId: string;
    batchNumber: string;
    quantity: number;
  }[];
}

interface ItemBalanceDetail {
  itemId: string;
  itemName: string;
  itemCode: string | null;
  unitName: string;
  unitSymbol: string;
  totalQuantity: number;
  locations: ItemLocationBalance[];
}

interface LocationBalanceRow {
  itemId: string;
  itemName: string;
  itemCode: string | null;
  unitName: string;
  unitSymbol: string;
  quantity: number;
}

interface LocationBalanceDetail {
  locationId: string;
  locationName: string;
  items: LocationBalanceRow[];
}

interface LowStockReport {
  data: unknown[];
  limitation: string;
}

const itemWithUnitSelect = {
  id: true,
  name: true,
  code: true,
  unit: { select: { name: true, symbol: true } },
} as const;

type StockMovementLineWithRelations = Prisma.StockMovementLineGetPayload<{
  include: {
    item: {
      select: {
        id: true;
        name: true;
        code: true;
        itemType: true;
        unit: { select: { name: true; symbol: true } };
      };
    };
    batch: { select: { id: true; batchNumber: true } };
    sourceLocation: { select: { id: true; name: true } };
    targetLocation: { select: { id: true; name: true } };
  };
}>;

export class StockReportsService {
  public static async getStockBalances(
    organizationId: string,
    query: StockBalanceQuery
  ): Promise<{ total: number; data: StockBalanceRow[] }> {
    const lineWhere: Prisma.StockMovementLineWhereInput = {
      stockMovement: {
        organizationId,
        status: 'POSTED',
      },
      ...(query.itemId ? { itemId: query.itemId } : {}),
      ...(query.batchId ? { batchId: query.batchId } : {}),
      item: {
        organizationId,
        ...(query.itemType ? { itemType: query.itemType } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search, mode: 'insensitive' } },
                { sku: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      ...(query.locationId
        ? {
            OR: [
              { sourceLocationId: query.locationId },
              { targetLocationId: query.locationId },
            ],
          }
        : {}),
    };

    const lines = await prisma.stockMovementLine.findMany({
      where: lineWhere,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            code: true,
            itemType: true,
            unit: { select: { name: true, symbol: true } },
          },
        },
        batch: { select: { id: true, batchNumber: true } },
        sourceLocation: { select: { id: true, name: true } },
        targetLocation: { select: { id: true, name: true } },
      },
    });

    const rows = this.buildBalanceRows(lines, query.includeZero);
    rows.sort((a, b) => this.compareBalanceRows(a, b, query.sortBy, query.sortOrder));

    const total = rows.length;
    const start = (query.page - 1) * query.pageSize;

    return {
      total,
      data: rows.slice(start, start + query.pageSize),
    };
  }

  public static async getStockBalancesByItem(
    organizationId: string,
    itemId: string,
    query: StockBalanceByItemQuery
  ): Promise<ItemBalanceDetail> {
    const item = await prisma.item.findFirst({
      where: { id: itemId, organizationId },
      select: itemWithUnitSelect,
    });
    if (!item) {
      throw new NotFoundError(`Item with ID ${itemId} not found in this organization`);
    }

    const locations = await prisma.stockLocation.findMany({
      where: {
        organizationId,
        isActive: true,
        ...(query.locationId ? { id: query.locationId } : {}),
      },
      select: { id: true, name: true },
    });

    if (query.locationId && locations.length === 0) {
      throw new NotFoundError(`Location with ID ${query.locationId} not found in this organization`);
    }

    const batches = await prisma.stockBatch.findMany({
      where: {
        organizationId,
        itemId,
        ...(query.batchId ? { id: query.batchId } : {}),
      },
      select: { id: true, batchNumber: true },
    });

    if (query.batchId && batches.length === 0) {
      throw new NotFoundError(`Batch with ID ${query.batchId} not found for this item`);
    }

    const locationBalances: ItemLocationBalance[] = [];
    let totalQuantity = 0;

    for (const location of locations) {
      const quantity = await StockLedgerService.calculateBalanceForItemLocation(
        organizationId,
        itemId,
        location.id,
        query.batchId
      );

      const batchBalances: { batchId: string; batchNumber: string; quantity: number }[] = [];
      for (const batch of batches) {
        const batchQty = await StockLedgerService.calculateBalanceForItemLocation(
          organizationId,
          itemId,
          location.id,
          batch.id
        );
        if (query.includeZero || batchQty !== 0) {
          batchBalances.push({
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            quantity: batchQty,
          });
        }
      }

      if (query.includeZero || quantity !== 0 || batchBalances.length > 0) {
        locationBalances.push({
          locationId: location.id,
          locationName: location.name,
          quantity,
          batches: batchBalances,
        });
        totalQuantity += quantity;
      }
    }

    return {
      itemId: item.id,
      itemName: item.name,
      itemCode: item.code,
      unitName: item.unit.name,
      unitSymbol: item.unit.symbol,
      totalQuantity,
      locations: locationBalances,
    };
  }

  public static async getStockBalancesByLocation(
    organizationId: string,
    locationId: string,
    query: StockBalanceByLocationQuery
  ): Promise<LocationBalanceDetail> {
    const location = await prisma.stockLocation.findFirst({
      where: { id: locationId, organizationId },
      select: { id: true, name: true },
    });
    if (!location) {
      throw new NotFoundError(`Location with ID ${locationId} not found in this organization`);
    }

    const items = await prisma.item.findMany({
      where: {
        organizationId,
        ...(query.itemType ? { itemType: query.itemType } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search, mode: 'insensitive' } },
                { sku: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: itemWithUnitSelect,
    });

    const rows: LocationBalanceRow[] = [];
    for (const item of items) {
      const quantity = await StockLedgerService.calculateBalanceForItemLocation(
        organizationId,
        item.id,
        locationId
      );
      if (!query.includeZero && quantity === 0) continue;

      rows.push({
        itemId: item.id,
        itemName: item.name,
        itemCode: item.code,
        unitName: item.unit.name,
        unitSymbol: item.unit.symbol,
        quantity,
      });
    }

    return {
      locationId: location.id,
      locationName: location.name,
      items: rows,
    };
  }

  public static async getStockMovements(
    organizationId: string,
    query: StockMovementQuery
  ): Promise<{ total: number; data: unknown[] }> {
    const skip = (query.page - 1) * query.pageSize;
    const where: Prisma.StockMovementWhereInput = { organizationId };

    if (query.movementType) where.type = query.movementType;
    if (query.status) where.status = query.status;
    if (query.sourceDocumentType) where.sourceDocumentType = query.sourceDocumentType;
    if (query.sourceDocumentId) where.sourceDocumentId = query.sourceDocumentId;
    if (query.fromDate || query.toDate) {
      where.timestamp = {
        ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}),
        ...(query.toDate ? { lte: new Date(query.toDate) } : {}),
      };
    }
    if (query.itemId || query.locationId || query.batchId) {
      where.lines = {
        some: {
          ...(query.itemId ? { itemId: query.itemId } : {}),
          ...(query.batchId ? { batchId: query.batchId } : {}),
          ...(query.locationId
            ? {
                OR: [
                  { sourceLocationId: query.locationId },
                  { targetLocationId: query.locationId },
                ],
              }
            : {}),
        },
      };
    }

    const [total, data] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          lines: {
            include: {
              item: { select: { id: true, name: true, code: true } },
              unit: { select: { id: true, name: true, symbol: true } },
              sourceLocation: { select: { id: true, name: true } },
              targetLocation: { select: { id: true, name: true } },
              batch: { select: { id: true, batchNumber: true } },
            },
          },
          createdBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          postedBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
    ]);

    return { total, data };
  }

  public static async getStockBatches(
    organizationId: string,
    query: StockBatchQuery
  ): Promise<{ total: number; data: unknown[] }> {
    const skip = (query.page - 1) * query.pageSize;
    const where: Prisma.StockBatchWhereInput = {
      organizationId,
      ...(query.itemId ? { itemId: query.itemId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.expirationFrom || query.expirationTo
        ? {
            expirationDate: {
              ...(query.expirationFrom ? { gte: new Date(query.expirationFrom) } : {}),
              ...(query.expirationTo ? { lte: new Date(query.expirationTo) } : {}),
            },
          }
        : {}),
      ...(query.search ? { batchNumber: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [total, batches, locations] = await Promise.all([
      prisma.stockBatch.count({ where }),
      prisma.stockBatch.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          item: { select: { id: true, name: true, code: true } },
          unit: { select: { id: true, name: true, symbol: true } },
          receivedLocation: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
      prisma.stockLocation.findMany({
        where: {
          organizationId,
          ...(query.locationId ? { id: query.locationId } : {}),
        },
        select: { id: true },
      }),
    ]);

    const data = await Promise.all(
      batches.map(async (batch) => {
        let calculatedQuantity = 0;
        for (const location of locations) {
          calculatedQuantity += await StockLedgerService.calculateBalanceForItemLocation(
            organizationId,
            batch.itemId,
            location.id,
            batch.id
          );
        }

        return {
          ...batch,
          calculatedQuantity,
        };
      })
    );

    return { total, data };
  }

  public static async getLowStockItems(): Promise<LowStockReport> {
    return {
      data: [],
      limitation: 'Minimum stock thresholds are not modeled yet, so low-stock candidates cannot be calculated safely.',
    };
  }

  private static buildBalanceRows(
    lines: StockMovementLineWithRelations[],
    includeZero: boolean
  ): StockBalanceRow[] {
    const rowMap = new Map<string, StockBalanceRow>();
    const applyLine = (
      line: StockMovementLineWithRelations,
      location: { id: string; name: string } | null,
      sign: 1 | -1
    ) => {
      if (!location) return;

      const key = `${line.itemId}:${location.id}:${line.batchId || 'no-batch'}`;
      const quantityDelta = Number(line.quantity) * sign;
      const current = rowMap.get(key);

      if (current) {
        current.quantity += quantityDelta;
        return;
      }

      rowMap.set(key, {
        itemId: line.itemId,
        itemName: line.item.name,
        itemCode: line.item.code,
        itemType: line.item.itemType,
        locationId: location.id,
        locationName: location.name,
        batchId: line.batch?.id || null,
        batchNumber: line.batch?.batchNumber || null,
        unitName: line.item.unit.name,
        unitSymbol: line.item.unit.symbol,
        quantity: quantityDelta,
      });
    };

    for (const line of lines) {
      applyLine(line, line.targetLocation, 1);
      applyLine(line, line.sourceLocation, -1);
    }

    return Array.from(rowMap.values()).filter((row) => includeZero || row.quantity !== 0);
  }

  private static compareBalanceRows(
    a: StockBalanceRow,
    b: StockBalanceRow,
    sortBy: StockBalanceQuery['sortBy'],
    sortOrder: StockBalanceQuery['sortOrder']
  ): number {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const result = typeof aValue === 'number'
      ? aValue - (bValue as number)
      : String(aValue || '').localeCompare(String(bValue || ''));

    return sortOrder === 'asc' ? result : -result;
  }
}

export default StockReportsService;
