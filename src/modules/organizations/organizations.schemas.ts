import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/validation/zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  baseCurrency: z.string().min(3).max(3).default('USD'),
  locale: z.string().min(2).max(10).default('en-US'),
  timezone: z.string().min(2).max(50).default('UTC'),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  baseCurrency: z.string().min(3).max(3).optional(),
  locale: z.string().min(2).max(10).optional(),
  timezone: z.string().min(2).max(50).optional(),
  isActive: z.boolean().optional(),
});

export const organizationQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  isActive: z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : undefined, z.boolean().optional()),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type OrganizationQuery = z.infer<typeof organizationQuerySchema>;
