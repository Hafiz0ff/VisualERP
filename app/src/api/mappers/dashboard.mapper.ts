import type { DashboardResponse } from '../types';
import { toFiniteNumber } from '@/lib/number-format';

export interface MappedDashboardStats {
  rawMaterialsTotal: number;
  rawMaterialsInWorkshop: number | null;
  finishedProductsTotal: number;
  lowStockCount: number;
  producedToday: number;
  producedMonth: number;
  incomingMonth: number | null;
  shippedMonth: number;
  writeOffMonth: number;
  activeProd: number;
  pendingDocs: number;
}

export function mapDashboardStats(data: DashboardResponse | null): MappedDashboardStats {
  if (!data) {
    return {
      rawMaterialsTotal: 0,
      rawMaterialsInWorkshop: null,
      finishedProductsTotal: 0,
      lowStockCount: 0,
      producedToday: 0,
      producedMonth: 0,
      incomingMonth: null,
      shippedMonth: 0,
      writeOffMonth: 0,
      activeProd: 0,
      pendingDocs: 0,
    };
  }

  const stockSummary = data.stockSummary || {};
  const qtyByType = stockSummary.totalQtyByType || {};

  const rawMaterialsTotal = toFiniteNumber(stockSummary.totalStockItems);
  const finishedProductsTotal = toFiniteNumber(qtyByType['FINISHED_PRODUCT']) + toFiniteNumber(qtyByType['SEMI_FINISHED']);

  // Sum up pending documents
  const pendingDocs =
    toFiniteNumber(data.pendingDocuments?.draftPurchaseReceiptsCount) +
    toFiniteNumber(data.pendingDocuments?.draftTransfersCount) +
    toFiniteNumber(data.pendingDocuments?.draftShipmentsCount) +
    toFiniteNumber(data.pendingDocuments?.draftWriteOffsCount) +
    toFiniteNumber(data.pendingDocuments?.countedInventoryAuditsCount);

  return {
    rawMaterialsTotal,
    rawMaterialsInWorkshop: null,
    finishedProductsTotal,
    lowStockCount: data.lowStockItems?.length || 0,
    producedToday: toFiniteNumber(data.productionSummary?.byStatus?.['COMPLETED']),
    producedMonth: toFiniteNumber(data.productionSummary?.completedCurrentMonthCount),
    incomingMonth: null,
    shippedMonth: toFiniteNumber(data.shipmentSummary?.shippedCurrentMonthCount),
    writeOffMonth: toFiniteNumber(data.writeOffSummary?.postedCurrentMonthCount),
    activeProd: toFiniteNumber(data.productionSummary?.byStatus?.['IN_PROGRESS']),
    pendingDocs,
  };
}
