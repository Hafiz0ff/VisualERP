# Frontend Data Contracts

This document outlines the conceptual JSON Data Transfer Objects (DTOs) returned by the backend endpoints to the React frontend.

---

## 1. DashboardResponse
```typescript
interface DashboardResponse {
  stockSummary: {
    totalStockItems: number;
    totalStockLocations: number;
    totalStockBatches: number;
    totalQtyByType: Record<string, number>;
  };
  // Currently always empty because minimum stock thresholds are not modeled yet.
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
```

---

## 2. ItemListItem
```typescript
interface ItemListItem {
  id: string;
  name: string;
  code: string | null;
  sku: string | null;
  description: string | null;
  itemType: 'MATERIAL' | 'COMPONENT' | 'PACKAGING' | 'SEMI_FINISHED' | 'FINISHED_PRODUCT' | 'SERVICE' | 'CONSUMABLE';
  isActive: boolean;
  unit: {
    id: string;
    symbol: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
}
```

---

## 3. StockBalanceRow
```typescript
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
```

---

## 4. PurchaseReceiptListItem & Detail
```typescript
interface PurchaseReceiptListItem {
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

interface PurchaseReceiptDetail extends PurchaseReceiptListItem {
  createdBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  postedAt: string | null;
  cancelledAt: string | null;
  lines: {
    id: string;
    itemId: string;
    itemName: string;
    itemCode: string | null;
    quantity: number;
    unitSymbol: string;
    batchNumber: string;
    expirationDate: string | null;
    costPerUnit: number;
    totalPrice: number | null;
  }[];
}
```

---

## 5. TransferListItem & Detail
```typescript
interface TransferListItem {
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

interface TransferDetail extends TransferListItem {
  createdBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  postedAt: string | null;
  cancelledAt: string | null;
  lines: {
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unitSymbol: string;
    batchId: string | null;
    batchNumber: string | null;
  }[];
}
```

---

## 6. ProductionOrderListItem & Detail
```typescript
interface ProductionOrderListItem {
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

interface ProductionOrderDetail extends ProductionOrderListItem {
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
  createdBy: {
    id: string;
    email: string;
  };
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
```

---

## 7. ShipmentListItem & Detail
```typescript
interface ShipmentListItem {
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

interface ShipmentDetail extends ShipmentListItem {
  sourceLocation: {
    id: string;
    name: string;
  };
  shippedAt: string | null;
  cancelledAt: string | null;
  createdBy: {
    id: string;
    email: string;
  };
  lines: {
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unitSymbol: string;
    batchNumber: string | null;
    pricePerUnit: number | null;
  }[];
}
```

---

## 8. WriteOffListItem & Detail
```typescript
interface WriteOffListItem {
  id: string;
  writeOffNumber: string;
  date: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  reason: 'TECHNOLOGICAL_LOSS' | 'DEFECT' | 'DAMAGE' | 'INVENTORY_CORRECTION' | 'SAMPLE' | 'OTHER';
  createdAt: string;
}

interface WriteOffDetail extends WriteOffListItem {
  description: string | null;
  location: {
    id: string;
    name: string;
  };
  responsibleUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  postedAt: string | null;
  cancelledAt: string | null;
  lines: {
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unitSymbol: string;
    batchNumber: string | null;
  }[];
}
```

---

## 9. InventoryAuditListItem & Detail
```typescript
interface InventoryAuditListItem {
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

interface InventoryAuditDetail extends InventoryAuditListItem {
  auditor: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  countedAt: string | null;
  approvedAt: string | null;
  cancelledAt: string | null;
  lines: {
    id: string;
    itemId: string;
    itemName: string;
    itemCode: string | null;
    batchId: string | null;
    batchNumber: string | null;
    expectedQuantity: number;
    actualQuantity: number;
    discrepancyQuantity: number;
    unitSymbol: string;
  }[];
}
```

---

## 10. AuditLogItem
Current Phase 10 source: `DashboardResponse.recentAuditEvents`. A dedicated `GET /api/audit-logs` endpoint is still planned, so the full detail DTO below is a target contract, not a current runtime response.

```typescript
interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}
```

---

## Phase 11 Data Contracts Status

Completed on 2026-06-25. Aligned all DTO schemas. Unused fields and discrepancies in nested item/unit properties have been resolved inside `documents.mapper.ts` to map live data to UI structures seamlessly.
