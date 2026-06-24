import { TransactionClient } from '../db/transaction';
import { prisma } from '../../db/prisma';

/**
 * Base repository pattern that standardizes organization context scoping
 * and supports running operations within database transactions.
 */
export abstract class BaseRepository {
  protected readonly db: TransactionClient;
  protected readonly organizationId: string;

  constructor(organizationId: string, tx?: TransactionClient) {
    this.organizationId = organizationId;
    this.db = tx || prisma;
  }

  /**
   * Scopes queries by injecting the active organizationId.
   */
  protected scopeWhere<TWhere extends Record<string, unknown>>(
    where: TWhere = {} as TWhere
  ): TWhere & { organizationId: string } {
    return {
      ...where,
      organizationId: this.organizationId,
    };
  }
}
