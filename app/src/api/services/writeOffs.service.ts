import { apiRequest } from '../client';
import type { WriteOffDetail } from '../types';

export interface CreateWriteOffLineInput {
  itemId: string;
  quantity: number;
  unitId: string;
  batchId?: string | null;
}

export interface CreateWriteOffInput {
  date: string;
  locationId: string;
  reason: 'TECHNOLOGICAL_LOSS' | 'DEFECT' | 'DAMAGE' | 'INVENTORY_CORRECTION' | 'SAMPLE' | 'OTHER';
  description?: string | null;
  lines: CreateWriteOffLineInput[];
}

export interface UpdateWriteOffInput {
  date?: string;
  locationId?: string;
  reason?: 'TECHNOLOGICAL_LOSS' | 'DEFECT' | 'DAMAGE' | 'INVENTORY_CORRECTION' | 'SAMPLE' | 'OTHER';
  description?: string | null;
  lines?: CreateWriteOffLineInput[];
}

export const writeOffsService = {
  async create(data: CreateWriteOffInput): Promise<WriteOffDetail> {
    const res = await apiRequest<{ data: WriteOffDetail }>('POST', '/api/write-offs', {
      body: data,
    });
    return res.data;
  },

  async update(id: string, data: UpdateWriteOffInput): Promise<WriteOffDetail> {
    const res = await apiRequest<{ data: WriteOffDetail }>('PATCH', `/api/write-offs/${id}`, {
      body: data,
    });
    return res.data;
  },

  async post(id: string, idempotencyKey: string): Promise<WriteOffDetail> {
    const res = await apiRequest<{ data: WriteOffDetail }>('POST', `/api/write-offs/${id}/post`, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },

  async cancel(id: string, idempotencyKey: string): Promise<WriteOffDetail> {
    const res = await apiRequest<{ data: WriteOffDetail }>('POST', `/api/write-offs/${id}/cancel`, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },
};
