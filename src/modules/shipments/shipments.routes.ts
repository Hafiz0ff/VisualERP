import { FastifyInstance } from 'fastify';
import { ShipmentsService } from './shipments.service';
import {
  createShipmentSchema,
  updateShipmentSchema,
  shipmentQuerySchema,
  CreateShipmentInput,
  UpdateShipmentInput,
  ShipmentQuery,
} from './shipments.schemas';
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

export async function shipmentsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preValidation: [validateQuery(shipmentQuerySchema)],
      preHandler: [requirePermission('shipments:read')],
    },
    async (request, reply) => {
      const query = request.query as ShipmentQuery;
      const { total, data } = await ShipmentsService.list(
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
      preValidation: [validateBody(createShipmentSchema)],
      preHandler: [requirePermission('shipments:create')],
    },
    async (request, reply) => {
      const userId = getWorkflowUserIdFromRequest(request);
      const shipment = await ShipmentsService.create(
        request.organizationId!,
        userId,
        request.body as CreateShipmentInput
      );
      return reply.status(201).send(formatResponse(shipment, request.requestId));
    }
  );

  app.get(
    '/:id',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('shipments:read')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const shipment = await ShipmentsService.findById(
        request.organizationId!,
        id
      );
      return reply.status(200).send(formatResponse(shipment, request.requestId));
    }
  );

  app.patch(
    '/:id',
    {
      preValidation: [
        validateParams(idParamSchema),
        validateBody(updateShipmentSchema),
      ],
      preHandler: [requirePermission('shipments:update')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const shipment = await ShipmentsService.update(
        request.organizationId!,
        id,
        request.body as UpdateShipmentInput
      );
      return reply.status(200).send(formatResponse(shipment, request.requestId));
    }
  );

  app.post(
    '/:id/ship',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('shipments:ship'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const shipment = await ShipmentsService.ship(
        request.organizationId!,
        id,
        userId
      );
      return reply.status(200).send(formatResponse(shipment, request.requestId));
    }
  );

  app.post(
    '/:id/cancel',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('shipments:cancel'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const shipment = await ShipmentsService.cancel(
        request.organizationId!,
        id,
        userId
      );
      return reply.status(200).send(formatResponse(shipment, request.requestId));
    }
  );
}
export default shipmentsRoutes;
