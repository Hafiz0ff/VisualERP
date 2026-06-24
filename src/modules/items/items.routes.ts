import { FastifyInstance } from 'fastify';
import { ItemsService } from './items.service';
import { createItemSchema, updateItemSchema, itemQuerySchema, CreateItemInput, ItemQuery, UpdateItemInput } from './items.schemas';
import { validateBody, validateParams, validateQuery } from '../../shared/validation/zod';
import { idParamSchema } from '../../shared/validation/zod';
import { formatResponse, formatListResponse } from '../../shared/api/response';

export async function itemsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preValidation: [validateQuery(itemQuerySchema)] },
    async (request, reply) => {
      const query = request.query as ItemQuery;
      const { total, data } = await ItemsService.list(request.organizationId!, query);
      return reply.status(200).send(
        formatListResponse(data, { page: query.page, pageSize: query.pageSize, total }, request.requestId)
      );
    }
  );

  app.post(
    '/',
    { preValidation: [validateBody(createItemSchema)] },
    async (request, reply) => {
      const item = await ItemsService.create(request.organizationId!, request.body as CreateItemInput);
      return reply.status(201).send(formatResponse(item, request.requestId));
    }
  );

  app.get(
    '/:id',
    { preValidation: [validateParams(idParamSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const item = await ItemsService.findById(request.organizationId!, id);
      return reply.status(200).send(formatResponse(item, request.requestId));
    }
  );

  app.patch(
    '/:id',
    { preValidation: [validateParams(idParamSchema), validateBody(updateItemSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const item = await ItemsService.update(request.organizationId!, id, request.body as UpdateItemInput);
      return reply.status(200).send(formatResponse(item, request.requestId));
    }
  );
}
export default itemsRoutes;
