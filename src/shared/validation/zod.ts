import { preValidationHookHandler } from 'fastify';
import { AnyZodObject, z } from 'zod';

export function validateBody(schema: AnyZodObject): preValidationHookHandler {
  return async (request) => {
    request.body = await schema.parseAsync(request.body);
  };
}

export function validateQuery(schema: AnyZodObject): preValidationHookHandler {
  return async (request) => {
    request.query = await schema.parseAsync(request.query);
  };
}

export function validateParams(schema: AnyZodObject): preValidationHookHandler {
  return async (request) => {
    request.params = await schema.parseAsync(request.params);
  };
}

// Reusable schemas
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

