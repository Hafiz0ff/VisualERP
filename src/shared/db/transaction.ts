import { prisma } from '../../db/prisma';
import { Prisma } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

/**
 * Execute a unit of work inside an atomic database transaction.
 * All operations executed on the provided transaction client (tx)
 * will succeed or fail together.
 */
export async function runInTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn);
}
