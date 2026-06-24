import { z } from 'zod';
import { ModuleKey } from '@prisma/client';
import { paginationQuerySchema } from '../../shared/validation/zod';

export const createIndustryProfileSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  defaultCategories: z.array(z.string()).default([]),
  defaultModules: z.array(z.nativeEnum(ModuleKey)).default([]),
});

export const updateIndustryProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  defaultCategories: z.array(z.string()).optional(),
  defaultModules: z.array(z.nativeEnum(ModuleKey)).optional(),
});

export const codeParamSchema = z.object({
  id: z.string().min(2).max(50), // We map codeParam to id param for route consistency
});

export const industryProfileQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(['createdAt', 'updatedAt', 'code', 'name']).default('createdAt'),
});

export type CreateIndustryProfileInput = z.infer<typeof createIndustryProfileSchema>;
export type UpdateIndustryProfileInput = z.infer<typeof updateIndustryProfileSchema>;
export type IndustryProfileQuery = z.infer<typeof industryProfileQuerySchema>;
