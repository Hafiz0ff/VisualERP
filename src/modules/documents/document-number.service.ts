import { prisma } from '../../db/prisma';
import { TransactionClient } from '../../shared/db/transaction';

export class DocumentNumberService {
  /**
   * Generates the next sequential document number for a given prefix and organization.
   * Format: PREFIX-000001 (e.g., REC-000001)
   *
   * Concurrency and Transaction Safety:
   * - Uses Prisma's atomic `upsert` with `{ currentValue: { increment: 1 } }`.
   * - In PostgreSQL, executing this inside a transaction (tx) blocks concurrent updates to the same
   *   [organizationId, prefix] row using row-level locking until the transaction commits or rolls back.
   * - Using `tx` ensures that no numbers are skipped or duplicated even under high concurrency.
   * - Note: If called outside a transaction, brief race conditions are theoretically possible during
   *   high concurrent initial inserts of the sequence record, but subsequent updates are safe.
   */
  public static async generateNextNumber(
    organizationId: string,
    prefix: string,
    tx?: TransactionClient
  ): Promise<string> {
    const client = tx || prisma;

    const sequence = await client.documentSequence.upsert({
      where: {
        organizationId_prefix: {
          organizationId,
          prefix,
        },
      },
      update: {
        currentValue: {
          increment: 1,
        },
      },
      create: {
        organizationId,
        prefix,
        currentValue: 1,
      },
    });

    const padded = String(sequence.currentValue).padStart(6, '0');
    return `${prefix.toUpperCase()}-${padded}`;
  }
}
export default DocumentNumberService;
