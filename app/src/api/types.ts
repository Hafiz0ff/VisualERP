export interface Organization {
  id: string;
  name: string;
  code: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
}

export interface ItemCategory {
  id: string;
  name: string;
}

export type ItemType = 'MATERIAL' | 'COMPONENT' | 'PACKAGING' | 'SEMI_FINISHED' | 'FINISHED_PRODUCT' | 'SERVICE' | 'CONSUMABLE';

export interface Item {
  id: string;
  name: string;
  code: string | null;
  sku: string | null;
  description: string | null;
  itemType: ItemType;
  isActive: boolean;
  unit: Unit;
  category: ItemCategory | null;
}

export interface StockLocation {
  id: string;
  name: string;
  code: string;
  type?: 'WAREHOUSE' | 'WORKSHOP' | 'PRODUCTION_AREA' | 'RETAIL_POINT' | 'VIRTUAL';
  locationType?: 'WAREHOUSE' | 'WORKSHOP' | 'TRANSIT' | 'CUSTOMER' | 'SUPPLIER';
  isActive: boolean;
}

export interface StockBalanceRow {
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

export interface StockBatch {
  id: string;
  itemId: string;
  item: {
    name: string;
    code?: string | null;
    unit?: {
      symbol: string;
    };
  };
  unit?: Unit;
  batchNumber: string;
  quantity?: number;
  calculatedQuantity?: number;
  initialQuantity?: number;
  costPerUnit: number | null;
  receivedAt?: string;
  receivedDate?: string | null;
  expirationDate: string | null;
  status: 'ACTIVE' | 'APPROVED' | 'QUARANTINE' | 'REJECTED' | 'DEPLETED' | 'EXPIRED' | 'HOLD';
  locationId?: string;
  receivedLocationId?: string | null;
  receivedLocation?: {
    id: string;
    name: string;
  } | null;
  supplier?: {
    id: string;
    name: string;
  } | null;
}

export interface StockMovementLine {
  id: string;
  itemId: string;
  quantity: number;
  sourceLocationId: string | null;
  targetLocationId: string | null;
  batchId: string | null;
  item: {
    name: string;
    unit: {
      symbol: string;
    };
  };
  batch?: {
    batchNumber: string;
  } | null;
}

export interface StockMovement {
  id: string;
  movementNumber: string;
  movementType: 'INCOMING' | 'OUTGOING' | 'TRANSFER' | 'INVENTORY_ADJUSTMENT';
  date: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  description: string | null;
  postedAt: string | null;
  lines: StockMovementLine[];
}

interface DocumentLineItemRef {
  name: string;
  code: string | null;
}

interface DocumentLineUnitRef {
  symbol: string;
}

interface DocumentLineBatchRef {
  batchNumber: string;
}

export interface PurchaseReceiptListItem {
  id: string;
  receiptNumber: string;
  date: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  targetLocation: {
    id: string;
    name: string;
  };
  supplier: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

export interface PurchaseReceiptLine {
  id: string;
  itemId: string;
  itemName?: string;
  itemCode?: string | null;
  item?: DocumentLineItemRef;
  quantity: number;
  unitId?: string;
  unitSymbol?: string;
  unit?: DocumentLineUnitRef;
  batchNumber: string;
  expirationDate: string | null;
  costPerUnit: number;
  totalPrice: number | null;
}

export interface PurchaseReceiptDetail extends PurchaseReceiptListItem {
  postedAt: string | null;
  cancelledAt: string | null;
  lines: PurchaseReceiptLine[];
}

export interface TransferListItem {
  id: string;
  transferNumber: string;
  date: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  sourceLocation: {
    id: string;
    name: string;
  };
  targetLocation: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface TransferLine {
  id: string;
  itemId: string;
  itemName?: string;
  item?: DocumentLineItemRef;
  quantity: number;
  unitId?: string;
  unitSymbol?: string;
  unit?: DocumentLineUnitRef;
  batchId: string | null;
  batchNumber?: string | null;
  batch?: DocumentLineBatchRef | null;
}

export interface TransferDetail extends TransferListItem {
  postedAt: string | null;
  cancelledAt: string | null;
  lines: TransferLine[];
}

export interface ProductionOrderListItem {
  id: string;
  orderNumber: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  targetItem: {
    id: string;
    name: string;
    code: string | null;
  };
  plannedQuantity: number;
  actualQuantity: number | null;
  scheduledDate: string;
  createdAt: string;
}

export interface ProductionOrderDetail extends ProductionOrderListItem {
  bomId: string | null;
  bomVersion: string | null;
  workshopLocation: {
    id: string;
    name: string;
  };
  actualStartDate: string | null;
  actualEndDate: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  plannedLines: {
    id: string;
    itemId: string;
    itemName: string;
    plannedQuantity: number;
    unitSymbol: string;
  }[];
  consumptions: {
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unitSymbol: string;
    batchNumber: string | null;
    timestamp: string;
  }[];
  outputs: {
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unitSymbol: string;
    batchNumber: string | null;
    timestamp: string;
  }[];
}

export interface ShipmentListItem {
  id: string;
  shipmentNumber: string;
  date: string;
  status: 'DRAFT' | 'SHIPPED' | 'CANCELLED';
  customer: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

export interface ShipmentDetail extends ShipmentListItem {
  sourceLocation: {
    id: string;
    name: string;
  };
  shippedAt: string | null;
  cancelledAt: string | null;
  lines: {
    id: string;
    itemId: string;
    itemName?: string;
    item?: DocumentLineItemRef;
    quantity: number;
    unitId?: string;
    unitSymbol?: string;
    unit?: DocumentLineUnitRef;
    batchNumber?: string | null;
    batch?: DocumentLineBatchRef | null;
    pricePerUnit: number | null;
  }[];
}

export interface WriteOffListItem {
  id: string;
  writeOffNumber: string;
  date: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  reason: 'TECHNOLOGICAL_LOSS' | 'DEFECT' | 'DAMAGE' | 'INVENTORY_CORRECTION' | 'SAMPLE' | 'OTHER';
  createdAt: string;
}

export interface WriteOffDetail extends WriteOffListItem {
  description: string | null;
  location: {
    id: string;
    name: string;
  };
  postedAt: string | null;
  cancelledAt: string | null;
  lines: {
    id: string;
    itemId: string;
    itemName?: string;
    item?: DocumentLineItemRef;
    quantity: number;
    unitId?: string;
    unitSymbol?: string;
    unit?: DocumentLineUnitRef;
    batchNumber?: string | null;
    batch?: DocumentLineBatchRef | null;
  }[];
}

export interface InventoryAuditListItem {
  id: string;
  auditNumber: string;
  auditDate: string;
  status: 'DRAFT' | 'COUNTED' | 'APPROVED' | 'CANCELLED';
  location: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface InventoryAuditDetail extends InventoryAuditListItem {
  countedAt: string | null;
  approvedAt: string | null;
  cancelledAt: string | null;
  lines: {
    id: string;
    itemId: string;
    itemName?: string;
    itemCode?: string | null;
    item?: DocumentLineItemRef;
    batchId: string | null;
    batchNumber?: string | null;
    batch?: DocumentLineBatchRef | null;
    expectedQuantity: number;
    actualQuantity: number;
    discrepancyQuantity: number;
    unitId: string;
    unitSymbol?: string;
    unit?: DocumentLineUnitRef;
  }[];
}

export interface DashboardResponse {
  stockSummary: {
    totalStockItems: number;
    totalStockLocations: number;
    totalStockBatches: number;
    totalQtyByType: Record<string, number>;
  };
  lowStockItems: [];
  productionSummary: {
    byStatus: Record<string, number>;
    completedCurrentMonthCount: number;
    latestCompleted: {
      id: string;
      orderNumber: string;
      targetItemId: string;
      targetItemName: string;
      targetItemCode: string | null;
      actualQuantity: number | null;
      completedAt: string;
    }[];
  };
  shipmentSummary: {
    byStatus: Record<string, number>;
    shippedCurrentMonthCount: number;
    latestShipped: {
      id: string;
      shipmentNumber: string;
      customerId: string | null;
      customerName: string | null;
      shippedAt: string;
    }[];
  };
  writeOffSummary: {
    byStatus: Record<string, number>;
    postedCurrentMonthCount: number;
    byReason: Record<string, number>;
  };
  pendingDocuments: {
    draftPurchaseReceiptsCount: number;
    draftTransfersCount: number;
    plannedOrInProgressProductionOrdersCount: number;
    draftShipmentsCount: number;
    draftWriteOffsCount: number;
    countedInventoryAuditsCount: number;
  };
  recentAuditEvents: {
    id: string;
    timestamp: string;
    userId: string | null;
    userEmail: string | null;
    userFullName: string | null;
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
  }[];
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
}

export interface BOMDetail {
  id: string;
  outputItemId: string;
  name: string;
  version: string;
  isActive: boolean;
  createdAt: string;
  outputItem: {
    id: string;
    name: string;
    code: string | null;
  };
  lines: {
    id: string;
    inputItemId: string;
    quantity: number | string;
    unitId: string;
    wastePercent: number | string | null;
    notes: string | null;
    inputItem: {
      id: string;
      name: string;
      code: string | null;
    };
    unit: {
      id: string;
      name: string;
      symbol: string;
    };
  }[];
}
