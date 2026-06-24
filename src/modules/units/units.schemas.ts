import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/validation/zod';

export const createUnitSchema = z.object({
  symbol: z.string().min(1).max(10),
  name: z.string().min(1).max(50),
  isBaseUnit: z.boolean().default(true),
});

export const updateUnitSchema = z.object({
  symbol: z.string().min(1).max(10).optional(),
  name: z.string().min(1).max(50).optional(),
  isBaseUnit: z.boolean().optional(),
});

export const unitQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(['createdAt', 'updatedAt', 'symbol', 'name']).default('symbol'),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type UnitQuery = z.infer<typeof unitQuerySchema>;
