import { apiRequest } from '../client';
import type { TransferDetail } from '../types';

export interface CreateTransferLineInput {
  itemId: string;
  quantity: number;
  unitId: string;
  batchId?: string | null;
}

export interface CreateTransferInput {
  date: string;
  sourceLocationId: string;
  targetLocationId: string;
  lines: CreateTransferLineInput[];
}

export interface UpdateTransferInput {
  date?: string;
  sourceLocationId?: string;
  targetLocationId?: string;
  lines?: CreateTransferLineInput[];
}

export const transfersService = {
  async create(data: CreateTransferInput): Promise<TransferDetail> {
    const res = await apiRequest<{ data: TransferDetail }>('POST', '/api/transfers', {
      body: data,
    });
    return res.data;
  },

  async update(id: string, data: UpdateTransferInput): Promise<TransferDetail> {
    const res = await apiRequest<{ data: TransferDetail }>('PATCH', `/api/transfers/${id}`, {
      body: data,
    });
    return res.data;
  },

  async post(id: string, idempotencyKey: string): Promise<TransferDetail> {
    const res = await apiRequest<{ data: TransferDetail }>('POST', `/api/transfers/${id}/post`, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },

  async cancel(id: string, idempotencyKey: string): Promise<TransferDetail> {
    const res = await apiRequest<{ data: TransferDetail }>('POST', `/api/transfers/${id}/cancel`, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },
};
