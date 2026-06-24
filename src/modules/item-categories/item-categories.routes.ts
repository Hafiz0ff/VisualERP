import { FastifyInstance } from 'fastify';
import { ItemCategoriesService } from './item-categories.service';
import { createItemCategorySchema, updateItemCategorySchema, itemCategoryQuerySchema, CreateItemCategoryInput, ItemCategoryQuery, UpdateItemCategoryInput } from './item-categories.schemas';
import { validateBody, validateParams, validateQuery } from '../../shared/validation/zod';
import { idParamSchema } from '../../shared/validation/zod';
import { formatListResponse, formatResponse } from '../../shared/api/response';

export async function itemCategoriesRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preValidation: [validateQuery(itemCategoryQuerySchema)] },
    async (request, reply) => {
      const query = request.query as ItemCategoryQuery;
      const { total, data } = await ItemCategoriesService.list(request.organizationId!, query);
      return reply.status(200).send(
        formatListResponse(data, { page: query.page, pageSize: query.pageSize, total }, request.requestId)
      );
    }
  );

  app.post(
    '/',
    { preValidation: [validateBody(createItemCategorySchema)] },
    async (request, reply) => {
      const category = await ItemCategoriesService.create(request.organizationId!, request.body as CreateItemCategoryInput);
      return reply.status(201).send(formatResponse(category, request.requestId));
    }
  );

  app.get(
    '/:id',
    { preValidation: [validateParams(idParamSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const category = await ItemCategoriesService.findById(request.organizationId!, id);
      return reply.status(200).send(formatResponse(category, request.requestId));
    }
  );

  app.patch(
    '/:id',
    { preValidation: [validateParams(idParamSchema), validateBody(updateItemCategorySchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const category = await ItemCategoriesService.update(request.organizationId!, id, request.body as UpdateItemCategoryInput);
      return reply.status(200).send(formatResponse(category, request.requestId));
    }
  );
}
export default itemCategoriesRoutes;
