import { MovementType, MovementStatus } from '@prisma/client';

export interface CreateStockMovementLineInput {
  itemId: string;
  batchId?: string | null;
  quantity: number; // Must be positive (> 0)
  unitId: string;
  sourceLocationId?: string | null;
  targetLocationId?: string | null;
  costPerUnit?: number | null;
}

export interface CreateStockMovementInput {
  type: MovementType;
  sourceDocumentType: string;
  sourceDocumentId: string;
  createdByUserId: string;
  timestamp: Date;
  lines: CreateStockMovementLineInput[];
}

export interface StockBalance {
  itemId: string;
  locationId: string;
  batchId: string | null;
  quantity: number;
}

export type BatchResolutionStrategy = 'MANUAL' | 'FIFO' | 'FEFO';

export interface StockMovementListQuery {
  page?: number;
  pageSize?: number;
  type?: MovementType;
  status?: MovementStatus;
  sourceDocumentId?: string;
}
