import { apiRequest } from '../client';
import type { InventoryAuditDetail } from '../types';

export interface CreateInventoryAuditLineInput {
  itemId: string;
  actualQuantity?: number;
  unitId: string;
  batchId?: string | null;
}

export interface CreateInventoryAuditInput {
  auditDate?: string;
  locationId: string;
  lines?: CreateInventoryAuditLineInput[];
}

export interface UpdateInventoryAuditLineInput {
  itemId: string;
  actualQuantity: number;
  unitId: string;
  batchId?: string | null;
}

export interface UpdateInventoryAuditInput {
  auditDate?: string;
  locationId?: string;
  lines?: UpdateInventoryAuditLineInput[];
}

export interface CountInventoryAuditInput {
  lines: UpdateInventoryAuditLineInput[];
}

export const inventoryAuditsService = {
  async create(data: CreateInventoryAuditInput): Promise<InventoryAuditDetail> {
    const res = await apiRequest<{ data: InventoryAuditDetail }>('POST', '/api/inventory-audits', {
      body: data,
    });
    return res.data;
  },

  async update(id: string, data: UpdateInventoryAuditInput): Promise<InventoryAuditDetail> {
    const res = await apiRequest<{ data: InventoryAuditDetail }>('PATCH', `/api/inventory-audits/${id}`, {
      body: data,
    });
    return res.data;
  },

  async count(id: string, data: CountInventoryAuditInput, idempotencyKey: string): Promise<InventoryAuditDetail> {
    const res = await apiRequest<{ data: InventoryAuditDetail }>('POST', `/api/inventory-audits/${id}/count`, {
      body: data,
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },

  async approve(id: string, idempotencyKey: string): Promise<InventoryAuditDetail> {
    const res = await apiRequest<{ data: InventoryAuditDetail }>('POST', `/api/inventory-audits/${id}/approve`, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },

  async cancel(id: string, idempotencyKey: string): Promise<InventoryAuditDetail> {
    const res = await apiRequest<{ data: InventoryAuditDetail }>('POST', `/api/inventory-audits/${id}/cancel`, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return res.data;
  },
};
