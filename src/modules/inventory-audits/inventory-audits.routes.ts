import { FastifyInstance } from 'fastify';
import { InventoryAuditsService } from './inventory-audits.service';
import {
  createInventoryAuditSchema,
  CountInventoryAuditInput,
  CreateInventoryAuditInput,
  UpdateInventoryAuditInput,
  InventoryAuditQuery,
  updateInventoryAuditSchema,
  countInventoryAuditSchema,
  inventoryAuditQuerySchema,
} from './inventory-audits.schemas';
import { validateBody, validateParams, validateQuery } from '../../shared/validation/zod';
import { idParamSchema } from '../../shared/validation/zod';
import { requirePermission } from '../../shared/auth/require-permission';
import {
  preHandlerIdempotency,
  onSendIdempotency,
  onErrorIdempotency,
} from '../../shared/idempotency/idempotency.hooks';
import { formatResponse, formatListResponse } from '../../shared/api/response';
import { getWorkflowUserIdFromRequest } from '../../shared/auth/workflow-user';

export async function inventoryAuditsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preValidation: [validateQuery(inventoryAuditQuerySchema)],
      preHandler: [requirePermission('inventory_audits:read')],
    },
    async (request, reply) => {
      const query = request.query as InventoryAuditQuery;
      const { total, data } = await InventoryAuditsService.list(
        request.organizationId!,
        query
      );
      return reply
        .status(200)
        .send(
          formatListResponse(
            data,
            { page: query.page, pageSize: query.pageSize, total },
            request.requestId
          )
        );
    }
  );

  app.post(
    '/',
    {
      preValidation: [validateBody(createInventoryAuditSchema)],
      preHandler: [requirePermission('inventory_audits:create')],
    },
    async (request, reply) => {
      const userId = getWorkflowUserIdFromRequest(request);
      const audit = await InventoryAuditsService.create(
        request.organizationId!,
        userId,
        request.body as CreateInventoryAuditInput
      );
      return reply.status(201).send(formatResponse(audit, request.requestId));
    }
  );

  app.get(
    '/:id',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('inventory_audits:read')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const audit = await InventoryAuditsService.findById(
        request.organizationId!,
        id
      );
      return reply.status(200).send(formatResponse(audit, request.requestId));
    }
  );

  app.patch(
    '/:id',
    {
      preValidation: [
        validateParams(idParamSchema),
        validateBody(updateInventoryAuditSchema),
      ],
      preHandler: [requirePermission('inventory_audits:update')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const audit = await InventoryAuditsService.update(
        request.organizationId!,
        id,
        request.body as UpdateInventoryAuditInput
      );
      return reply.status(200).send(formatResponse(audit, request.requestId));
    }
  );

  app.post(
    '/:id/count',
    {
      preValidation: [
        validateParams(idParamSchema),
        validateBody(countInventoryAuditSchema),
      ],
      preHandler: [requirePermission('inventory_audits:count'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const audit = await InventoryAuditsService.count(
        request.organizationId!,
        id,
        userId,
        request.body as CountInventoryAuditInput
      );
      return reply.status(200).send(formatResponse(audit, request.requestId));
    }
  );

  app.post(
    '/:id/approve',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('inventory_audits:approve'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const audit = await InventoryAuditsService.approve(
        request.organizationId!,
        id,
        userId
      );
      return reply.status(200).send(formatResponse(audit, request.requestId));
    }
  );

  app.post(
    '/:id/cancel',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('inventory_audits:cancel'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const audit = await InventoryAuditsService.cancel(
        request.organizationId!,
        id,
        userId
      );
      return reply.status(200).send(formatResponse(audit, request.requestId));
    }
  );
}
export default inventoryAuditsRoutes;
