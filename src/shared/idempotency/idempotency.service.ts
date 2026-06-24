import { createHash } from 'crypto';
import { prisma } from '../../db/prisma';
import { IdempotencyConflictError } from '../errors/app-error';

export class IdempotencyService {
  /**
   * Calculate SHA-256 hash of request payload.
   */
  public static calculateHash(payload: unknown): string {
    const dataString = typeof payload === 'string' ? payload : JSON.stringify(payload || {});
    return createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Checks if an idempotency key exists.
   * If a previous request is RESOLVED and the hash matches, returns the cached status and payload.
   * If the hash does not match, throws IdempotencyConflictError.
   * If the key does not exist or has expired, creates a new PENDING record.
   */
  public static async startRequest(params: {
    organizationId: string;
    key: string;
    method: string;
    path: string;
    requestBody: unknown;
  }): Promise<{ status: 'PENDING' | 'RESOLVED'; responseStatus?: number; responseBody?: unknown }> {
    const requestHash = this.calculateHash(params.requestBody);
    const now = new Date();

    const existing = await prisma.idempotencyKey.findUnique({
      where: {
        organizationId_key: {
          organizationId: params.organizationId,
          key: params.key,
        },
      },
    });

    if (existing) {
      // If key expired, delete it and allow fresh execution
      if (existing.expiresAt < now) {
        await prisma.idempotencyKey.delete({
          where: { id: existing.id },
        });
      } else {
        // If request hash does not match, throw conflict
        if (existing.requestHash !== requestHash) {
          throw new IdempotencyConflictError();
        }

        if (existing.status === 'RESOLVED') {
          return {
            status: 'RESOLVED',
            responseStatus: existing.responseStatus || 200,
            responseBody: existing.responseBody,
          };
        }

        // If PENDING, return PENDING status (prevents concurrent double execution)
        return {
          status: 'PENDING',
        };
      }
    }

    // Set 24 hour retention period
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.idempotencyKey.create({
      data: {
        organizationId: params.organizationId,
        key: params.key,
        method: params.method,
        path: params.path,
        requestHash,
        status: 'PENDING',
        expiresAt,
      },
    });

    return {
      status: 'PENDING',
    };
  }

  /**
   * Save the resolution status and payload body for the idempotency key.
   */
  public static async resolveRequest(params: {
    organizationId: string;
    key: string;
    responseStatus: number;
    responseBody: unknown;
  }): Promise<void> {
    await prisma.idempotencyKey.update({
      where: {
        organizationId_key: {
          organizationId: params.organizationId,
          key: params.key,
        },
      },
      data: {
        status: 'RESOLVED',
        responseStatus: params.responseStatus,
        responseBody: params.responseBody ? JSON.parse(JSON.stringify(params.responseBody)) : null,
      },
    });
  }
}
export default IdempotencyService;
