import { onErrorHookHandler, onSendHookHandler, preHandlerHookHandler } from 'fastify';
import { IdempotencyService } from './idempotency.service';
import { ValidationError } from '../errors/app-error';

/**
 * Fastify hook executing before route validation and handler code.
 * If the idempotency key was already resolved, immediately returns the cached response
 * and bypasses the handler execution.
 */
export const preHandlerIdempotency: preHandlerHookHandler = async (request, reply) => {
  const key = request.headers['idempotency-key'] as string;
  if (!key) {
    throw new ValidationError('Idempotency-Key header is required for this endpoint', [
      { header: 'Idempotency-Key' },
    ]);
  }

  const organizationId = request.organizationId;
  if (!organizationId) {
    return;
  }

  const result = await IdempotencyService.startRequest({
    organizationId,
    key,
    method: request.method,
    path: request.url,
    requestBody: request.body,
  });

  if (result.status === 'RESOLVED') {
    reply.header('X-Cache-Lookup', 'HIT');
    
    // Set response headers and send the cached body back
    return reply
      .status(result.responseStatus || 200)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(result.responseBody);
  }
};

/**
 * Fastify hook executing when serializing the response payload.
 * Caches successful 2xx responses under the idempotency key.
 */
export const onSendIdempotency: onSendHookHandler = async (request, reply, payload) => {
  const key = request.headers['idempotency-key'] as string;
  if (!key) {
    return payload;
  }

  const organizationId = request.organizationId;
  if (!organizationId) {
    return payload;
  }

  // If this response was served directly from cache (HIT), skip resolving again
  if (reply.getHeader('X-Cache-Lookup') === 'HIT') {
    return payload;
  }

  // Only cache successful mutations (status codes in the 2xx range)
  if (reply.statusCode >= 200 && reply.statusCode < 300) {
    let parsedBody: unknown = null;
    try {
      if (typeof payload === 'string') {
        parsedBody = JSON.parse(payload);
      } else if (Buffer.isBuffer(payload)) {
        parsedBody = JSON.parse(payload.toString('utf-8'));
      } else {
        parsedBody = payload;
      }
    } catch {
      parsedBody = payload;
    }

    await IdempotencyService.resolveRequest({
      organizationId,
      key,
      responseStatus: reply.statusCode,
      responseBody: parsedBody,
    });
  }

  return payload;
};

export const onErrorIdempotency: onErrorHookHandler = async (request, reply, error) => {
  const key = request.headers['idempotency-key'] as string;
  const organizationId = request.organizationId;

  if (!key || !organizationId || reply.getHeader('X-Cache-Lookup') === 'HIT') {
    return;
  }

  await IdempotencyService.clearRequest({
    organizationId,
    key,
  });
};
