import { z } from 'zod';
import { LocationType } from '@prisma/client';
import { paginationQuerySchema } from '../../shared/validation/zod';

export const createLocationSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(LocationType),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(LocationType).optional(),
  isActive: z.boolean().optional(),
});

export const locationQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'code', 'type']).default('createdAt'),
  type: z.nativeEnum(LocationType).optional(),
  isActive: z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : undefined, z.boolean().optional()),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type LocationQuery = z.infer<typeof locationQuerySchema>;
export default createLocationSchema;
