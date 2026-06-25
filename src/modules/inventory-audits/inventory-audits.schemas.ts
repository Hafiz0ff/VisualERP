import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/validation/zod';
import { InventoryAuditStatus } from '@prisma/client';

export const createInventoryAuditSchema = z.object({
  auditDate: z.string().datetime({ message: 'Audit date must be a valid ISO DateTime' }).optional(),
  locationId: z.string().uuid('Location ID must be a valid UUID'),
  lines: z.array(z.object({
    itemId: z.string().uuid('Item ID must be a valid UUID'),
    actualQuantity: z.number().min(0, 'Actual quantity must be zero or greater').optional(),
    unitId: z.string().uuid('Unit ID must be a valid UUID'),
    batchId: z.string().uuid('Batch ID must be a valid UUID').optional().nullable(),
  }).strict()).optional(),
}).strict();

export const updateInventoryAuditLineSchema = z.object({
  itemId: z.string().uuid('Item ID must be a valid UUID'),
  actualQuantity: z.number().min(0, 'Actual quantity must be zero or greater'),
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  batchId: z.string().uuid('Batch ID must be a valid UUID').optional().nullable(),
}).strict();

export const updateInventoryAuditSchema = z.object({
  auditDate: z.string().datetime({ message: 'Audit date must be a valid ISO DateTime' }).optional(),
  locationId: z.string().uuid('Location ID must be a valid UUID').optional(),
  lines: z.array(updateInventoryAuditLineSchema).min(1, 'At least one audit line is required').optional(),
}).strict();

export const countInventoryAuditSchema = z.object({
  lines: z.array(updateInventoryAuditLineSchema).min(1, 'At least one counted audit line is required'),
}).strict();

export const inventoryAuditQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(InventoryAuditStatus).optional(),
});

export type CreateInventoryAuditInput = z.infer<typeof createInventoryAuditSchema>;
export type UpdateInventoryAuditInput = z.infer<typeof updateInventoryAuditSchema>;
export type CountInventoryAuditInput = z.infer<typeof countInventoryAuditSchema>;
export type InventoryAuditQuery = z.infer<typeof inventoryAuditQuerySchema>;

export default createInventoryAuditSchema;
