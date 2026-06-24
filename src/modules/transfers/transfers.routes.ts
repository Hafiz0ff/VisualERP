import { FastifyInstance } from 'fastify';
import { TransfersService } from './transfers.service';
import {
  createTransferSchema,
  CreateTransferInput,
  TransferQuery,
  updateTransferSchema,
  UpdateTransferInput,
  transferQuerySchema,
} from './transfers.schemas';
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

export async function transfersRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preValidation: [validateQuery(transferQuerySchema)],
      preHandler: [requirePermission('transfers:read')],
    },
    async (request, reply) => {
      const query = request.query as TransferQuery;
      const { total, data } = await TransfersService.list(
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
      preValidation: [validateBody(createTransferSchema)],
      preHandler: [requirePermission('transfers:create')],
    },
    async (request, reply) => {
      const userId = getWorkflowUserIdFromRequest(request);
      const transfer = await TransfersService.create(
        request.organizationId!,
        userId,
        request.body as CreateTransferInput
      );
      return reply.status(201).send(formatResponse(transfer, request.requestId));
    }
  );

  app.get(
    '/:id',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('transfers:read')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const transfer = await TransfersService.findById(
        request.organizationId!,
        id
      );
      return reply.status(200).send(formatResponse(transfer, request.requestId));
    }
  );

  app.patch(
    '/:id',
    {
      preValidation: [
        validateParams(idParamSchema),
        validateBody(updateTransferSchema),
      ],
      preHandler: [requirePermission('transfers:update')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const transfer = await TransfersService.update(
        request.organizationId!,
        id,
        request.body as UpdateTransferInput
      );
      return reply.status(200).send(formatResponse(transfer, request.requestId));
    }
  );

  app.post(
    '/:id/post',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('transfers:post'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const transfer = await TransfersService.post(
        request.organizationId!,
        id,
        userId
      );
      return reply.status(200).send(formatResponse(transfer, request.requestId));
    }
  );

  app.post(
    '/:id/cancel',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('transfers:cancel'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const transfer = await TransfersService.cancel(
        request.organizationId!,
        id,
        userId
      );
      return reply.status(200).send(formatResponse(transfer, request.requestId));
    }
  );
}
export default transfersRoutes;
