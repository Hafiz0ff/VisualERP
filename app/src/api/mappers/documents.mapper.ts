import type {
  InventoryAuditDetail,
  ProductionOrderDetail,
  PurchaseReceiptDetail,
  ShipmentDetail,
  TransferDetail,
  WriteOffDetail,
} from '../types';

export interface MappedPurchaseReceipt {
  id: string;
  date: string;
  supplier: string;
  warehouse: string;
  status: 'draft' | 'posted' | 'cancelled';
  totalSum: number;
  comment: string;
  items: {
    materialId: string;
    materialName: string;
    batchId: string;
    batchName: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    total: number;
  }[];
}

export interface MappedTransfer {
  id: string;
  date: string;
  fromLocation: string;
  toLocation: string;
  status: 'pending' | 'completed' | 'cancelled';
  responsible: string;
  comment: string;
  items: {
    materialId: string;
    materialName: string;
    batchId: string;
    batchName: string;
    quantity: number;
    unit: string;
  }[];
}

export interface MappedProductionOrder {
  id: string;
  date: string;
  productId: string;
  productName: string;
  recipeId: string;
  plannedQuantity: number;
  actualQuantity: number;
  responsible: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  plannedMaterials: {
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
  }[];
  actualMaterialsUsed: {
    materialId: string;
    materialName: string;
    batchId?: string;
    quantity: number;
    unit: string;
  }[];
}

export interface MappedShipment {
  id: string;
  date: string;
  customer: string;
  status: 'draft' | 'shipped' | 'cancelled';
  totalSum: number;
  responsible: string;
  comment: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    price: number;
    total: number;
  }[];
}

export interface MappedWriteOff {
  id: string;
  date: string;
  type: 'losses' | 'defect' | 'spoilage' | 'inventory' | 'other';
  targetType: 'material';
  targetId: string;
  targetName: string;
  batchId?: string;
  batchName?: string;
  quantity: number;
  unit: string;
  reason: string;
  responsible: string;
  status: 'draft' | 'posted' | 'cancelled';
}

export interface MappedInventoryAudit {
  id: string;
  date: string;
  status: 'draft' | 'counted' | 'approved' | 'cancelled';
  location: string;
  items: {
    materialId: string;
    materialName: string;
    batchId: string;
    batchName: string;
    expected: number;
    actual: number;
    discrepancy: number;
    unit: string;
  }[];
}

export function mapPurchaseReceipt(doc: PurchaseReceiptDetail): MappedPurchaseReceipt {
  const totalSum = doc.lines.reduce(
    (sum, line) => sum + (line.totalPrice || line.quantity * (line.costPerUnit || 0)),
    0
  );

  return {
    id: doc.id,
    date: doc.date ? new Date(doc.date).toLocaleDateString() : '',
    supplier: doc.supplier?.name || 'Без поставщика',
    warehouse: doc.targetLocation?.name || 'Основной склад',
    status: doc.status.toLowerCase() as MappedPurchaseReceipt['status'],
    totalSum,
    comment: '',
    items: doc.lines.map((line) => ({
      materialId: line.itemId,
      materialName: line.itemName || 'Неизвестно',
      batchId: line.batchNumber,
      batchName: line.batchNumber,
      quantity: line.quantity,
      unit: line.unitSymbol || 'кг',
      pricePerUnit: line.costPerUnit || 0,
      total: line.totalPrice || line.quantity * (line.costPerUnit || 0),
    })),
  };
}

export function mapTransfer(doc: TransferDetail): MappedTransfer {
  return {
    id: doc.id,
    date: doc.date ? new Date(doc.date).toLocaleDateString() : '',
    fromLocation: doc.sourceLocation?.name || 'Склад',
    toLocation: doc.targetLocation?.name || 'Цех',
    status: doc.status === 'POSTED' ? 'completed' : doc.status === 'CANCELLED' ? 'cancelled' : 'pending',
    responsible: 'Администратор',
    comment: '',
    items: doc.lines.map((line) => ({
      materialId: line.itemId,
      materialName: line.itemName || 'Неизвестно',
      batchId: line.batchId || '',
      batchName: line.batchNumber || '',
      quantity: line.quantity,
      unit: line.unitSymbol || 'кг',
    })),
  };
}

export function mapProductionOrder(doc: ProductionOrderDetail): MappedProductionOrder {
  const dateStr = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '';
  const startDate = doc.actualStartDate ? new Date(doc.actualStartDate).toLocaleDateString() : undefined;
  const endDate = doc.actualEndDate ? new Date(doc.actualEndDate).toLocaleDateString() : undefined;

  return {
    id: doc.id,
    date: dateStr,
    productId: doc.targetItem?.id || '',
    productName: doc.targetItem?.name || 'Неизвестно',
    recipeId: doc.bomId || '',
    plannedQuantity: doc.plannedQuantity,
    actualQuantity: doc.actualQuantity || 0,
    responsible: 'Администратор',
    status: doc.status.toLowerCase() as MappedProductionOrder['status'],
    startDate,
    endDate,
    plannedMaterials: (doc.plannedLines || []).map((line) => ({
      materialId: line.itemId,
      materialName: line.itemName || 'Неизвестно',
      quantity: line.plannedQuantity,
      unit: line.unitSymbol || 'кг',
    })),
    actualMaterialsUsed: (doc.consumptions || []).map((line) => ({
      materialId: line.itemId,
      materialName: line.itemName || 'Неизвестно',
      batchId: line.batchNumber || undefined,
      quantity: line.quantity,
      unit: line.unitSymbol || 'кг',
    })),
  };
}

export function mapShipment(doc: ShipmentDetail): MappedShipment {
  const totalSum = (doc.lines || []).reduce((sum, line) => sum + line.quantity * (line.pricePerUnit || 0), 0);
  return {
    id: doc.id,
    date: doc.date ? new Date(doc.date).toLocaleDateString() : '',
    customer: doc.customer?.name || 'Без контрагента',
    status: doc.status.toLowerCase() as MappedShipment['status'],
    totalSum,
    responsible: 'Администратор',
    comment: '',
    items: (doc.lines || []).map((line) => ({
      productId: line.itemId,
      productName: line.itemName || 'Неизвестно',
      quantity: line.quantity,
      unit: line.unitSymbol || 'меш',
      price: line.pricePerUnit || 0,
      total: line.quantity * (line.pricePerUnit || 0),
    })),
  };
}

export function mapWriteOff(doc: WriteOffDetail): MappedWriteOff {
  const primaryLine = doc.lines?.[0];
  const reasonMap: Record<string, MappedWriteOff['type']> = {
    TECHNOLOGICAL_LOSS: 'losses',
    DEFECT: 'defect',
    DAMAGE: 'spoilage',
    INVENTORY_CORRECTION: 'inventory',
    SAMPLE: 'other',
    OTHER: 'other',
  };

  return {
    id: doc.id,
    date: doc.date ? new Date(doc.date).toLocaleDateString() : '',
    type: reasonMap[doc.reason] || 'other',
    targetType: 'material',
    targetId: primaryLine?.itemId || '',
    targetName: primaryLine?.itemName || '',
    batchId: primaryLine?.batchNumber || undefined,
    batchName: primaryLine?.batchNumber || undefined,
    quantity: primaryLine?.quantity || 0,
    unit: primaryLine?.unitSymbol || 'кг',
    reason: doc.description || '',
    responsible: 'Администратор',
    status: doc.status.toLowerCase() as MappedWriteOff['status'],
  };
}

export function mapInventoryAudit(doc: InventoryAuditDetail): MappedInventoryAudit {
  return {
    id: doc.id,
    date: doc.auditDate ? new Date(doc.auditDate).toLocaleDateString() : '',
    status: doc.status.toLowerCase() as MappedInventoryAudit['status'],
    location: doc.location?.name || 'Склад',
    items: (doc.lines || []).map((line) => ({
      materialId: line.itemId,
      materialName: line.itemName || 'Неизвестно',
      batchId: line.batchId || '',
      batchName: line.batchNumber || '',
      expected: line.expectedQuantity,
      actual: line.actualQuantity,
      discrepancy: line.discrepancyQuantity,
      unit: line.unitSymbol || 'кг',
    })),
  };
}
