import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/validation/zod';

export const bomQuerySchema = paginationQuerySchema.extend({
  outputItemId: z.string().uuid('Output item ID must be a valid UUID').optional(),
  isActive: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : undefined),
    z.boolean().optional()
  ),
});

export type BOMQuery = z.infer<typeof bomQuerySchema>;
