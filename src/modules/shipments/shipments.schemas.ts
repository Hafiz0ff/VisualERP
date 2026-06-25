import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/validation/zod';
import { ShipmentStatus } from '@prisma/client';

export const createShipmentLineSchema = z.object({
  itemId: z.string().uuid('Item ID must be a valid UUID'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  pricePerUnit: z.number().nonnegative('Price per unit must be non-negative').optional().nullable(),
  batchId: z.string().uuid('Batch ID must be a valid UUID').optional().nullable(),
}).strict();

export const createShipmentSchema = z.object({
  date: z.string().datetime({ message: 'Date must be a valid ISO DateTime' }),
  customerId: z.string().uuid('Customer ID must be a valid UUID').optional().nullable(),
  sourceLocationId: z.string().uuid('Source location ID must be a valid UUID'),
  lines: z.array(createShipmentLineSchema).min(1, 'At least one shipment line is required'),
}).strict();

export const updateShipmentSchema = z.object({
  date: z.string().datetime({ message: 'Date must be a valid ISO DateTime' }).optional(),
  customerId: z.string().uuid('Customer ID must be a valid UUID').optional().nullable(),
  sourceLocationId: z.string().uuid('Source location ID must be a valid UUID').optional(),
  lines: z.array(createShipmentLineSchema).min(1, 'At least one shipment line is required').optional(),
}).strict();

export const shipmentQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ShipmentStatus).optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type ShipmentQuery = z.infer<typeof shipmentQuerySchema>;

export default createShipmentSchema;
