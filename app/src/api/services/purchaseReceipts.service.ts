import { apiRequest } from '../client';
import type { PurchaseReceiptDetail } from '../types';

export interface CreatePurchaseReceiptLineInput {
  itemId: string;
  quantity: number;
  unitId: string;
  batchNumber: string;
  expirationDate?: string | null;
  costPerUnit: number;
}

export interface CreatePurchaseReceiptInput {
  date: string;
  supplierId?: string | null;
  targetLocationId: string;
  lines: CreatePurchaseReceiptLineInput[];
}

export interface UpdatePurchaseReceiptInput {
  date?: string;
  supplierId?: string | null;
  targetLocationId?: string;
  lines?: CreatePurchaseReceiptLineInput[];
}

export const purchaseReceiptsService = {
  async create(data: CreatePurchaseReceiptInput): Promise<PurchaseReceiptDetail> {
    const res = await apiRequest<{ data: PurchaseReceiptDetail }>('POST', '/api/purchase-receipts', {
      body: data,
    });
    return res.data;
  },

  async update(id: string, data: UpdatePurchaseReceiptInput): Promise<PurchaseReceiptDetail> {
    const res = await apiRequest<{ data: PurchaseReceiptDetail }>('PATCH', `/api/purchase-receipts/${id}`, {
      body: data,
    });
    return res.data;
  },

  async post(id: string, idempotencyKey: string): Promise<PurchaseReceiptDetail> {
    const res = await apiRequest<{ data: PurchaseReceiptDetail }>('POST', `/api/purchase-receipts/${id}/post`, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },

  async cancel(id: string, idempotencyKey: string): Promise<PurchaseReceiptDetail> {
    const res = await apiRequest<{ data: PurchaseReceiptDetail }>('POST', `/api/purchase-receipts/${id}/cancel`, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },
};
