import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/validation/zod';

export const createItemCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().uuid('Parent Category ID must be a valid UUID').optional().nullable(),
});

export const updateItemCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  parentId: z.string().uuid('Parent Category ID must be a valid UUID').optional().nullable(),
});

export const itemCategoryQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('name'),
});

export type CreateItemCategoryInput = z.infer<typeof createItemCategorySchema>;
export type UpdateItemCategoryInput = z.infer<typeof updateItemCategorySchema>;
export type ItemCategoryQuery = z.infer<typeof itemCategoryQuerySchema>;
