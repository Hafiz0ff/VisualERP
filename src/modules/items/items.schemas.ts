import { z } from 'zod';
import { ItemType } from '@prisma/client';
import { paginationQuerySchema } from '../../shared/validation/zod';

export const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50).optional().nullable(),
  sku: z.string().min(1).max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid('Category ID must be a valid UUID').optional().nullable(),
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  itemType: z.nativeEnum(ItemType),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(50).optional().nullable(),
  sku: z.string().min(1).max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid('Category ID must be a valid UUID').optional().nullable(),
  unitId: z.string().uuid('Unit ID must be a valid UUID').optional(),
  itemType: z.nativeEnum(ItemType).optional(),
  isActive: z.boolean().optional(),
});

export const itemQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'code', 'sku']).default('createdAt'),
  itemType: z.nativeEnum(ItemType).optional(),
  isActive: z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : undefined, z.boolean().optional()),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ItemQuery = z.infer<typeof itemQuerySchema>;
export default createItemSchema;
