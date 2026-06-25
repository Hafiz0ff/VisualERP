import type { Item, StockBalanceRow } from '../types';

export interface MappedRawMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  warehouseStock: number;
  workshopStock: number;
  minStock: number | null;
  costPerUnit: number | null;
  status: 'not_configured';
  supplier?: string;
  batchIds?: string[];
}

export interface MappedFinishedProduct {
  id: string;
  name: string;
  packaging: string;
  unit: string;
  stock: number;
  producedToday: number;
  producedMonth: number;
  price: number | null;
}

export function mapRawMaterials(items: Item[], balances: StockBalanceRow[]): MappedRawMaterial[] {
  return items.map((item) => {
    const itemBalances = balances.filter((b) => b.itemId === item.id);
    
    let warehouseStock = 0;
    let workshopStock = 0;

    itemBalances.forEach((bal) => {
      const nameLower = bal.locationName.toLowerCase();
      const isWorkshop =
        nameLower.includes('цех') ||
        nameLower.includes('workshop') ||
        nameLower.includes('производ');
      
      if (isWorkshop) {
        workshopStock += bal.quantity;
      } else {
        warehouseStock += bal.quantity;
      }
    });

    const uniqueBatches = Array.from(
      new Set(itemBalances.map((b) => b.batchNumber).filter(Boolean))
    ) as string[];

    return {
      id: item.id,
      name: item.name,
      category: item.category?.name || 'Без категории',
      unit: item.unit.symbol,
      warehouseStock,
      workshopStock,
      minStock: null,
      costPerUnit: null,
      status: 'not_configured',
      batchIds: uniqueBatches,
    };
  });
}

export function mapFinishedProducts(items: Item[], balances: StockBalanceRow[]): MappedFinishedProduct[] {
  return items.map((item) => {
    const itemBalances = balances.filter((b) => b.itemId === item.id);
    const stock = itemBalances.reduce((sum, b) => sum + b.quantity, 0);

    return {
      id: item.id,
      name: item.name,
      packaging: item.description || '—',
      unit: item.unit.symbol,
      stock,
      producedToday: 0, // derived dynamically at production order page level
      producedMonth: 0,
      price: null,
    };
  });
}
