import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/validation/zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50).optional().nullable(),
  contactInfo: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(50).optional().nullable(),
  contactInfo: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const supplierQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'code']).default('createdAt'),
  isActive: z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : undefined, z.boolean().optional()),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierQuery = z.infer<typeof supplierQuerySchema>;

export default createSupplierSchema;
