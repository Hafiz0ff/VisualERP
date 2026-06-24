import { prisma } from '../../db/prisma';
import { TransactionClient } from '../db/transaction';

export interface AuditActionPayload {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditLogService {
  /**
   * Record a sensitive action to the AuditLog database table.
   * If a transaction client (tx) is provided, the record is written inside the transaction,
   * and database errors will propagate up to trigger a rollback.
   * If tx is absent, errors are caught to prevent blocking the primary operation.
   */
  public static async recordAction(
    payload: AuditActionPayload,
    tx?: TransactionClient
  ): Promise<void> {
    const client = tx || prisma;
    const data = {
      organizationId: payload.organizationId,
      userId: payload.userId || null,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      oldValue: payload.oldValue === undefined ? undefined : JSON.parse(JSON.stringify(payload.oldValue)),
      newValue: payload.newValue === undefined ? undefined : JSON.parse(JSON.stringify(payload.newValue)),
      ipAddress: payload.ipAddress || null,
      userAgent: payload.userAgent || null,
    };

    if (tx) {
      // In transaction: let errors propagate so the transaction rolls back atomically
      await client.auditLog.create({ data });
    } else {
      // Out of transaction: catch and log to keep operations resilient
      try {
        await client.auditLog.create({ data });
      } catch (error) {
        console.error('[AUDIT_LOG_ERROR] Failed to write audit log entry:', error, {
          organizationId: payload.organizationId,
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId,
        });
      }
    }
  }
}
export default AuditLogService;
