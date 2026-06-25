import { apiRequest } from '../client';
import type { ShipmentDetail } from '../types';

export interface CreateShipmentLineInput {
  itemId: string;
  quantity: number;
  unitId: string;
  pricePerUnit?: number | null;
  batchId?: string | null;
}

export interface CreateShipmentInput {
  date: string;
  customerId?: string | null;
  sourceLocationId: string;
  lines: CreateShipmentLineInput[];
}

export interface UpdateShipmentInput {
  date?: string;
  customerId?: string | null;
  sourceLocationId?: string;
  lines?: CreateShipmentLineInput[];
}

export const shipmentsService = {
  async create(data: CreateShipmentInput): Promise<ShipmentDetail> {
    const res = await apiRequest<{ data: ShipmentDetail }>('POST', '/api/shipments', {
      body: data,
    });
    return res.data;
  },

  async update(id: string, data: UpdateShipmentInput): Promise<ShipmentDetail> {
    const res = await apiRequest<{ data: ShipmentDetail }>('PATCH', `/api/shipments/${id}`, {
      body: data,
    });
    return res.data;
  },

  async ship(id: string, idempotencyKey: string): Promise<ShipmentDetail> {
    const res = await apiRequest<{ data: ShipmentDetail }>('POST', `/api/shipments/${id}/ship`, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },

  async cancel(id: string, idempotencyKey: string): Promise<ShipmentDetail> {
    const res = await apiRequest<{ data: ShipmentDetail }>('POST', `/api/shipments/${id}/cancel`, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },
};
