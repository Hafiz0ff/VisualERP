import type { StockBatch } from '../types';

export interface MappedBatch {
  id: string;
  materialId: string;
  materialName: string;
  supplier: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
  arrivalDate: string;
  expiryDate?: string;
  warehouse: string;
  status: 'active' | 'depleted' | 'expired';
  remaining: number;
}

export function mapStockBatches(batches: StockBatch[]): MappedBatch[] {
  return batches.map((b) => {
    let status: 'active' | 'depleted' | 'expired' = 'active';
    if (b.status === 'DEPLETED' || b.quantity <= 0) {
      status = 'depleted';
    } else if (b.status === 'EXPIRED') {
      status = 'expired';
    }

    const arrivalDate = b.receivedAt ? new Date(b.receivedAt).toLocaleDateString() : '';
    const expiryDate = b.expirationDate ? new Date(b.expirationDate).toLocaleDateString() : undefined;

    return {
      id: b.batchNumber,
      materialId: b.itemId,
      materialName: b.item?.name || 'Сырье',
      supplier: 'Поставщик', // Default placeholder
      quantity: b.initialQuantity,
      unit: b.item?.unit?.symbol || 'кг',
      pricePerUnit: b.costPerUnit,
      totalCost: b.initialQuantity * b.costPerUnit,
      arrivalDate,
      expiryDate,
      warehouse: b.locationId,
      status,
      remaining: b.quantity,
    };
  });
}
