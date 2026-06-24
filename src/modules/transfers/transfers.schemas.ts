import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/validation/zod';
import { DocumentStatus } from '@prisma/client';

export const createTransferLineSchema = z.object({
  itemId: z.string().uuid('Item ID must be a valid UUID'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  batchId: z.string().uuid('Batch ID must be a valid UUID').optional().nullable(),
}).strict();

export const createTransferSchema = z.object({
  date: z.string().datetime({ message: 'Date must be a valid ISO DateTime' }),
  sourceLocationId: z.string().uuid('Source location ID must be a valid UUID'),
  targetLocationId: z.string().uuid('Target location ID must be a valid UUID'),
  lines: z.array(createTransferLineSchema).min(1, 'At least one transfer line is required'),
}).strict();

export const updateTransferSchema = z.object({
  date: z.string().datetime({ message: 'Date must be a valid ISO DateTime' }).optional(),
  sourceLocationId: z.string().uuid('Source location ID must be a valid UUID').optional(),
  targetLocationId: z.string().uuid('Target location ID must be a valid UUID').optional(),
  lines: z.array(createTransferLineSchema).min(1, 'At least one transfer line is required').optional(),
}).strict();

export const transferQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(DocumentStatus).optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;
export type TransferQuery = z.infer<typeof transferQuerySchema>;

export default createTransferSchema;
