import { FastifyRequest } from 'fastify';
import { NotFoundError } from '../errors/app-error';
import { TransactionClient } from '../db/transaction';

const SYSTEM_WORKFLOW_EMAIL = 'system.workflow@visualerp.local';

export async function resolveWorkflowUserId(
  tx: TransactionClient,
  userId?: string | null
): Promise<string> {
  if (userId) {
    const user = await tx.user.findFirst({
      where: { id: userId, isActive: true },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError(`Active user not found with ID ${userId}`);
    }

    return user.id;
  }

  const systemUser = await tx.user.upsert({
    where: { email: SYSTEM_WORKFLOW_EMAIL },
    update: { isActive: true },
    create: {
      email: SYSTEM_WORKFLOW_EMAIL,
      passwordHash: 'phase-6-system-user',
      firstName: 'System',
      lastName: 'Workflow',
      isActive: true,
    },
    select: { id: true },
  });

  return systemUser.id;
}

export function getWorkflowUserIdFromRequest(request: FastifyRequest): string | undefined {
  const header = request.headers['x-user-id'];
  return Array.isArray(header) ? header[0] : header;
}
