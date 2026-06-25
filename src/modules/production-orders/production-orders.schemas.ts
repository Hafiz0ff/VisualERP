import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/validation/zod';
import { ProductionStatus } from '@prisma/client';

export const createProductionOrderSchema = z.object({
  targetItemId: z.string().uuid('Target item ID must be a valid UUID'),
  plannedQuantity: z.number().positive('Planned quantity must be greater than zero'),
  targetUnitId: z.string().uuid('Target unit ID must be a valid UUID'),
  bomId: z.string().uuid('BOM ID must be a valid UUID').optional().nullable(),
  workshopLocationId: z.string().uuid('Workshop location ID must be a valid UUID'),
  scheduledDate: z.string().datetime({ message: 'Scheduled date must be a valid ISO DateTime' }),
}).strict();

export const updateProductionOrderSchema = z.object({
  plannedQuantity: z.number().positive('Planned quantity must be greater than zero').optional(),
  bomId: z.string().uuid('BOM ID must be a valid UUID').optional().nullable(),
  workshopLocationId: z.string().uuid('Workshop location ID must be a valid UUID').optional(),
  scheduledDate: z.string().datetime({ message: 'Scheduled date must be a valid ISO DateTime' }).optional(),
}).strict();

export const completeConsumptionLineSchema = z.object({
  itemId: z.string().uuid('Item ID must be a valid UUID'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  batchId: z.string().uuid('Batch ID must be a valid UUID').optional().nullable(),
}).strict();

export const completeProductionOrderSchema = z.object({
  actualQuantity: z.number().positive('Actual output quantity must be greater than zero'),
  outputBatchNumber: z.string().min(1, 'Output batch number is required').max(100),
  outputExpirationDate: z.string().datetime({ message: 'Expiration date must be a valid ISO DateTime' }).optional().nullable(),
  productionLocationId: z.string().uuid('Production location ID must be a valid UUID'),
  consumptionLines: z.array(completeConsumptionLineSchema).optional(),
}).strict();

export const productionOrderQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ProductionStatus).optional(),
});

export type CreateProductionOrderInput = z.infer<typeof createProductionOrderSchema>;
export type UpdateProductionOrderInput = z.infer<typeof updateProductionOrderSchema>;
export type CompleteProductionOrderInput = z.infer<typeof completeProductionOrderSchema>;
export type ProductionOrderQuery = z.infer<typeof productionOrderQuerySchema>;

export default createProductionOrderSchema;
