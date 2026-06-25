import type { StockBatch } from '../types';
import { formatUnit } from '@/lib/number-format';

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
    const quantity = Number(b.calculatedQuantity ?? b.quantity ?? 0);
    const initialQuantity = Number(b.initialQuantity ?? quantity);
    const pricePerUnit = Number(b.costPerUnit ?? 0);

    let status: 'active' | 'depleted' | 'expired' = 'active';
    if (b.status === 'DEPLETED' || quantity <= 0) {
      status = 'depleted';
    } else if (b.status === 'EXPIRED') {
      status = 'expired';
    }

    const arrivalDate = b.receivedDate || b.receivedAt
      ? new Date(b.receivedDate || b.receivedAt || '').toLocaleDateString()
      : '';
    const expiryDate = b.expirationDate ? new Date(b.expirationDate).toLocaleDateString() : undefined;

    return {
      id: b.batchNumber,
      materialId: b.itemId,
      materialName: b.item?.name || 'Сырье',
      supplier: b.supplier?.name || 'Без поставщика',
      quantity: initialQuantity,
      unit: formatUnit(b.unit?.symbol || b.item?.unit?.symbol || 'кг'),
      pricePerUnit,
      totalCost: initialQuantity * pricePerUnit,
      arrivalDate,
      expiryDate,
      warehouse: b.receivedLocation?.name || b.receivedLocationId || b.locationId || '—',
      status,
      remaining: quantity,
    };
  });
}
