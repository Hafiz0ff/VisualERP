import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/validation/zod';
import { DocumentStatus, WriteOffReason } from '@prisma/client';

export const createWriteOffLineSchema = z.object({
  itemId: z.string().uuid('Item ID must be a valid UUID'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  batchId: z.string().uuid('Batch ID must be a valid UUID').optional().nullable(),
}).strict();

export const createWriteOffSchema = z.object({
  date: z.string().datetime({ message: 'Date must be a valid ISO DateTime' }),
  locationId: z.string().uuid('Location ID must be a valid UUID'),
  reason: z.nativeEnum(WriteOffReason, { errorMap: () => ({ message: 'Invalid write-off reason' }) }),
  description: z.string().optional().nullable(),
  lines: z.array(createWriteOffLineSchema).min(1, 'At least one write-off line is required'),
}).strict();

export const updateWriteOffSchema = z.object({
  date: z.string().datetime({ message: 'Date must be a valid ISO DateTime' }).optional(),
  locationId: z.string().uuid('Location ID must be a valid UUID').optional(),
  reason: z.nativeEnum(WriteOffReason).optional(),
  description: z.string().optional().nullable(),
  lines: z.array(createWriteOffLineSchema).min(1, 'At least one write-off line is required').optional(),
}).strict();

export const writeOffQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(DocumentStatus).optional(),
});

export type CreateWriteOffInput = z.infer<typeof createWriteOffSchema>;
export type UpdateWriteOffInput = z.infer<typeof updateWriteOffSchema>;
export type WriteOffQuery = z.infer<typeof writeOffQuerySchema>;

export default createWriteOffSchema;
