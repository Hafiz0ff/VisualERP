import { FastifyInstance } from 'fastify';
import { PurchaseReceiptsService } from './purchase-receipts.service';
import {
  createPurchaseReceiptSchema,
  CreatePurchaseReceiptInput,
  PurchaseReceiptQuery,
  updatePurchaseReceiptSchema,
  UpdatePurchaseReceiptInput,
  purchaseReceiptQuerySchema,
} from './purchase-receipts.schemas';
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

export async function purchaseReceiptsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preValidation: [validateQuery(purchaseReceiptQuerySchema)],
      preHandler: [requirePermission('purchase_receipts:read')],
    },
    async (request, reply) => {
      const query = request.query as PurchaseReceiptQuery;
      const { total, data } = await PurchaseReceiptsService.list(
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
      preValidation: [validateBody(createPurchaseReceiptSchema)],
      preHandler: [requirePermission('purchase_receipts:create')],
    },
    async (request, reply) => {
      const userId = getWorkflowUserIdFromRequest(request);
      const receipt = await PurchaseReceiptsService.create(
        request.organizationId!,
        userId,
        request.body as CreatePurchaseReceiptInput
      );
      return reply.status(201).send(formatResponse(receipt, request.requestId));
    }
  );

  app.get(
    '/:id',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('purchase_receipts:read')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const receipt = await PurchaseReceiptsService.findById(
        request.organizationId!,
        id
      );
      return reply.status(200).send(formatResponse(receipt, request.requestId));
    }
  );

  app.patch(
    '/:id',
    {
      preValidation: [
        validateParams(idParamSchema),
        validateBody(updatePurchaseReceiptSchema),
      ],
      preHandler: [requirePermission('purchase_receipts:update')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const receipt = await PurchaseReceiptsService.update(
        request.organizationId!,
        id,
        request.body as UpdatePurchaseReceiptInput
      );
      return reply.status(200).send(formatResponse(receipt, request.requestId));
    }
  );

  app.post(
    '/:id/post',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('purchase_receipts:post'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const receipt = await PurchaseReceiptsService.post(
        request.organizationId!,
        id,
        userId
      );
      return reply.status(200).send(formatResponse(receipt, request.requestId));
    }
  );

  app.post(
    '/:id/cancel',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('purchase_receipts:cancel'), preHandlerIdempotency],
      onSend: [onSendIdempotency],
      onError: [onErrorIdempotency],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = getWorkflowUserIdFromRequest(request);
      const receipt = await PurchaseReceiptsService.cancel(
        request.organizationId!,
        id,
        userId
      );
      return reply.status(200).send(formatResponse(receipt, request.requestId));
    }
  );
}
export default purchaseReceiptsRoutes;
