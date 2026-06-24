import { prisma } from '../../db/prisma';

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
   * Failures are caught and logged to prevent blocking the primary business transaction,
   * keeping operations resilient.
   */
  public static async recordAction(payload: AuditActionPayload): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: payload.organizationId,
          userId: payload.userId || null,
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId,
          oldValue: payload.oldValue === undefined ? undefined : JSON.parse(JSON.stringify(payload.oldValue)),
          newValue: payload.newValue === undefined ? undefined : JSON.parse(JSON.stringify(payload.newValue)),
          ipAddress: payload.ipAddress || null,
          userAgent: payload.userAgent || null,
        },
      });
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
export default AuditLogService;
