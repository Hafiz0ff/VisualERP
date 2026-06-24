import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/validation/zod';
import { DocumentStatus } from '@prisma/client';

export const createPurchaseReceiptLineSchema = z.object({
  itemId: z.string().uuid('Item ID must be a valid UUID'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  batchNumber: z.string().min(1, 'Batch number is required').max(100),
  expirationDate: z.string().datetime({ message: 'Expiration date must be a valid ISO DateTime' }).optional().nullable(),
  costPerUnit: z.number().nonnegative('Cost per unit must be non-negative'),
}).strict();

export const createPurchaseReceiptSchema = z.object({
  date: z.string().datetime({ message: 'Date must be a valid ISO DateTime' }),
  supplierId: z.string().uuid('Supplier ID must be a valid UUID').optional().nullable(),
  targetLocationId: z.string().uuid('Target location ID must be a valid UUID'),
  lines: z.array(createPurchaseReceiptLineSchema).min(1, 'At least one receipt line is required'),
}).strict();

export const updatePurchaseReceiptSchema = z.object({
  date: z.string().datetime({ message: 'Date must be a valid ISO DateTime' }).optional(),
  supplierId: z.string().uuid('Supplier ID must be a valid UUID').optional().nullable(),
  targetLocationId: z.string().uuid('Target location ID must be a valid UUID').optional(),
  lines: z.array(createPurchaseReceiptLineSchema).min(1, 'At least one receipt line is required').optional(),
}).strict();

export const purchaseReceiptQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(DocumentStatus).optional(),
  supplierId: z.string().uuid('Supplier ID must be a valid UUID').optional(),
});

export type CreatePurchaseReceiptInput = z.infer<typeof createPurchaseReceiptSchema>;
export type UpdatePurchaseReceiptInput = z.infer<typeof updatePurchaseReceiptSchema>;
export type PurchaseReceiptQuery = z.infer<typeof purchaseReceiptQuerySchema>;

export default createPurchaseReceiptSchema;
