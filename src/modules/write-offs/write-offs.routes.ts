import { FastifyInstance } from 'fastify';
import { WriteOffsService } from './write-offs.service';
import {
  createWriteOffSchema,
  CreateWriteOffInput,
  UpdateWriteOffInput,
  WriteOffQuery,
  updateWriteOffSchema,
  writeOffQuerySchema,
} from './write-offs.schemas';
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

export async function writeOffsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preValidation: [validateQuery(writeOffQuerySchema)],
      preHandler: [requirePermission('write_offs:read')],
    },
    async (request, reply) => {
      const query = request.query as WriteOffQuery;
      const { total, data } = await WriteOffsService.list(
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
      preValidation: [validateBody(createWriteOffSchema)],
      preHandler: [requirePermission('write_offs:create')],
    },
    async (request, reply) => {
      const userId = getWorkflowUserIdFromRequest(request);
      const writeOff = await WriteOffsService.create(
        request.organizationId!,
        userId,
        request.body as CreateWriteOffInput
      );
      return reply.status(201).send(formatResponse(writeOff, request.requestId));
    }
  );

  app.get(
    '/:id',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('write_offs:read')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const writeOff = await WriteOffsService.findById(
        request.organizationId!,
        id
      );
      return reply.status(200).send(formatResponse(writeOff, request.requestId));
    }
  );

  app.patch(
    '/:id',
    {
      preValidation: [
        validateParams(idParamSchema),
        validateBody(updateWriteOffSchema),
      ],
      preHandler: [requirePermission('write_offs:update')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const writeOff = await WriteOffsService.update(
        request.organizationId!,
        id,
        request.body as UpdateWriteOffInput
      );
      return reply.status(200).send(formatResponse(writeOff, request.requestId));
    }
  );

  app.post(
    '/:id/post',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('write_offs:post'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const writeOff = await WriteOffsService.post(
        request.organizationId!,
        id,
        userId
      );
      return reply.status(200).send(formatResponse(writeOff, request.requestId));
    }
  );

  app.post(
    '/:id/cancel',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('write_offs:cancel'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const writeOff = await WriteOffsService.cancel(
        request.organizationId!,
        id,
        userId
      );
      return reply.status(200).send(formatResponse(writeOff, request.requestId));
    }
  );
}
export default writeOffsRoutes;
