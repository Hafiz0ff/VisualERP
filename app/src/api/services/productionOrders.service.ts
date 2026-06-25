import { apiRequest } from '../client';
import type { ProductionOrderDetail } from '../types';

export interface CreateProductionOrderInput {
  targetItemId: string;
  plannedQuantity: number;
  targetUnitId: string;
  bomId?: string | null;
  workshopLocationId: string;
  scheduledDate: string;
}

export interface UpdateProductionOrderInput {
  plannedQuantity?: number;
  bomId?: string | null;
  workshopLocationId?: string;
  scheduledDate?: string;
}

export interface CompleteConsumptionLineInput {
  itemId: string;
  quantity: number;
  unitId: string;
  batchId?: string | null;
}

export interface CompleteProductionOrderInput {
  actualQuantity: number;
  outputBatchNumber: string;
  outputExpirationDate?: string | null;
  productionLocationId: string;
  consumptionLines?: CompleteConsumptionLineInput[];
}

export const productionOrdersService = {
  async create(data: CreateProductionOrderInput): Promise<ProductionOrderDetail> {
    const res = await apiRequest<{ data: ProductionOrderDetail }>('POST', '/api/production-orders', {
      body: data,
    });
    return res.data;
  },

  async update(id: string, data: UpdateProductionOrderInput): Promise<ProductionOrderDetail> {
    const res = await apiRequest<{ data: ProductionOrderDetail }>('PATCH', `/api/production-orders/${id}`, {
      body: data,
    });
    return res.data;
  },

  async start(id: string, idempotencyKey: string): Promise<ProductionOrderDetail> {
    const res = await apiRequest<{ data: ProductionOrderDetail }>('POST', `/api/production-orders/${id}/start`, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },

  async complete(id: string, data: CompleteProductionOrderInput, idempotencyKey: string): Promise<ProductionOrderDetail> {
    const res = await apiRequest<{ data: ProductionOrderDetail }>('POST', `/api/production-orders/${id}/complete`, {
      body: data,
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },

  async cancel(id: string, idempotencyKey: string): Promise<ProductionOrderDetail> {
    const res = await apiRequest<{ data: ProductionOrderDetail }>('POST', `/api/production-orders/${id}/cancel`, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },
};
