import { z } from 'zod';
import { BatchStatus, ItemType, MovementStatus, MovementType } from '@prisma/client';
import { paginationQuerySchema } from '../../shared/validation/zod';

const booleanQuery = z.preprocess((val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return val;
}, z.boolean());

/**
 * Query schema for stock balance listing.
 * Supports optional locationId and itemId filters on top of standard pagination.
 */
export const stockBalanceQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(['itemName', 'locationName', 'batchNumber', 'quantity']).default('itemName'),
  locationId: z.string().uuid().optional(),
  itemId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  itemType: z.nativeEnum(ItemType).optional(),
  categoryId: z.string().uuid().optional(),
  includeZero: booleanQuery.default(false),
}).strict();
export type StockBalanceQuery = z.infer<typeof stockBalanceQuerySchema>;

/**
 * Path parameter schema for by-item endpoints.
 */
export const itemIdParamSchema = z.object({
  itemId: z.string().uuid('Invalid UUID format'),
}).strict();
export type ItemIdParam = z.infer<typeof itemIdParamSchema>;

/**
 * Path parameter schema for by-location endpoints.
 */
export const locationIdParamSchema = z.object({
  locationId: z.string().uuid('Invalid UUID format'),
}).strict();
export type LocationIdParam = z.infer<typeof locationIdParamSchema>;

export const stockBalanceByItemQuerySchema = z.object({
  locationId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  includeZero: booleanQuery.default(false),
}).strict();
export type StockBalanceByItemQuery = z.infer<typeof stockBalanceByItemQuerySchema>;

export const stockBalanceByLocationQuerySchema = z.object({
  itemType: z.nativeEnum(ItemType).optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  includeZero: booleanQuery.default(false),
}).strict();
export type StockBalanceByLocationQuery = z.infer<typeof stockBalanceByLocationQuerySchema>;

/**
 * Query schema for stock movement listing with filters.
 */
export const stockMovementQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(['timestamp', 'createdAt', 'movementNumber', 'type', 'status']).default('timestamp'),
  movementType: z.nativeEnum(MovementType).optional(),
  status: z.nativeEnum(MovementStatus).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  itemId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  sourceDocumentType: z.string().min(1).max(100).optional(),
  sourceDocumentId: z.string().uuid().optional(),
}).strict();
export type StockMovementQuery = z.infer<typeof stockMovementQuerySchema>;

/**
 * Query schema for stock batch listing.
 */
export const stockBatchQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(['createdAt', 'batchNumber', 'receivedDate', 'expirationDate', 'status']).default('createdAt'),
  itemId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  status: z.nativeEnum(BatchStatus).optional(),
  expirationFrom: z.string().datetime().optional(),
  expirationTo: z.string().datetime().optional(),
}).strict();
export type StockBatchQuery = z.infer<typeof stockBatchQuerySchema>;

/**
 * Query schema for low-stock items report.
 */
export const lowStockQuerySchema = z.object({
}).strict();
export type LowStockQuery = z.infer<typeof lowStockQuerySchema>;
