import { FastifyInstance } from 'fastify';
import { ProductionOrdersService } from './production-orders.service';
import {
  createProductionOrderSchema,
  updateProductionOrderSchema,
  completeProductionOrderSchema,
  productionOrderQuerySchema,
  CreateProductionOrderInput,
  UpdateProductionOrderInput,
  CompleteProductionOrderInput,
  ProductionOrderQuery,
} from './production-orders.schemas';
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

export async function productionOrdersRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preValidation: [validateQuery(productionOrderQuerySchema)],
      preHandler: [requirePermission('production_orders:read')],
    },
    async (request, reply) => {
      const query = request.query as ProductionOrderQuery;
      const { total, data } = await ProductionOrdersService.list(
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
      preValidation: [validateBody(createProductionOrderSchema)],
      preHandler: [requirePermission('production_orders:create')],
    },
    async (request, reply) => {
      const userId = getWorkflowUserIdFromRequest(request);
      const order = await ProductionOrdersService.create(
        request.organizationId!,
        userId,
        request.body as CreateProductionOrderInput
      );
      return reply.status(201).send(formatResponse(order, request.requestId));
    }
  );

  app.get(
    '/:id',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('production_orders:read')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const order = await ProductionOrdersService.findById(
        request.organizationId!,
        id
      );
      return reply.status(200).send(formatResponse(order, request.requestId));
    }
  );

  app.patch(
    '/:id',
    {
      preValidation: [
        validateParams(idParamSchema),
        validateBody(updateProductionOrderSchema),
      ],
      preHandler: [requirePermission('production_orders:update')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const order = await ProductionOrdersService.update(
        request.organizationId!,
        id,
        request.body as UpdateProductionOrderInput
      );
      return reply.status(200).send(formatResponse(order, request.requestId));
    }
  );

  app.post(
    '/:id/start',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('production_orders:start'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const order = await ProductionOrdersService.start(
        request.organizationId!,
        id,
        userId
      );
      return reply.status(200).send(formatResponse(order, request.requestId));
    }
  );

  app.post(
    '/:id/complete',
    {
      preValidation: [
        validateParams(idParamSchema),
        validateBody(completeProductionOrderSchema),
      ],
      preHandler: [requirePermission('production_orders:complete'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const order = await ProductionOrdersService.complete(
        request.organizationId!,
        id,
        userId,
        request.body as CompleteProductionOrderInput
      );
      return reply.status(200).send(formatResponse(order, request.requestId));
    }
  );

  app.post(
    '/:id/cancel',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('production_orders:cancel'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const order = await ProductionOrdersService.cancel(
        request.organizationId!,
        id,
        userId
      );
      return reply.status(200).send(formatResponse(order, request.requestId));
    }
  );
}
export default productionOrdersRoutes;
