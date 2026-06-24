import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './app-error';

export function setupErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.requestId || 'req_unknown';
    const timestamp = new Date().toISOString();

    // 1. Handle custom AppError
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        meta: {
          requestId,
          timestamp,
        },
      });
    }

    // 2. Handle Zod validation errors
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed for request fields.',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            issue: e.message,
          })),
        },
        meta: {
          requestId,
          timestamp,
        },
      });
    }

    // 3. Fallback for unhandled internal errors
    request.log.error(error); // Log to Fastify logger

    // Avoid leaking stack trace in non-development env
    const isDev = process.env.NODE_ENV === 'development';
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: isDev ? error.message : 'An internal server error occurred. Please contact support.',
        details: isDev && error.stack ? [{ stack: error.stack }] : [],
      },
      meta: {
        requestId,
        timestamp,
      },
    });
  });
}
