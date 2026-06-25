import type { DashboardResponse } from '../types';

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

  const rawMaterialsTotal = stockSummary.totalStockItems || 0;
  const finishedProductsTotal = Number(qtyByType['FINISHED_PRODUCT'] || 0) + Number(qtyByType['SEMI_FINISHED'] || 0);

  // Sum up pending documents
  const pendingDocs =
    (data.pendingDocuments?.draftPurchaseReceiptsCount || 0) +
    (data.pendingDocuments?.draftTransfersCount || 0) +
    (data.pendingDocuments?.draftShipmentsCount || 0) +
    (data.pendingDocuments?.draftWriteOffsCount || 0) +
    (data.pendingDocuments?.countedInventoryAuditsCount || 0);

  return {
    rawMaterialsTotal,
    rawMaterialsInWorkshop: null,
    finishedProductsTotal,
    lowStockCount: data.lowStockItems?.length || 0,
    producedToday: data.productionSummary?.byStatus?.['COMPLETED'] || 0,
    producedMonth: data.productionSummary?.completedCurrentMonthCount || 0,
    incomingMonth: null,
    shippedMonth: data.shipmentSummary?.shippedCurrentMonthCount || 0,
    writeOffMonth: data.writeOffSummary?.postedCurrentMonthCount || 0,
    activeProd: data.productionSummary?.byStatus?.['IN_PROGRESS'] || 0,
    pendingDocs,
  };
}
