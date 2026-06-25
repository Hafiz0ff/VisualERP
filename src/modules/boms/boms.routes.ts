import { FastifyInstance } from 'fastify';
import { BOMsService } from './boms.service';
import { bomQuerySchema, BOMQuery } from './boms.schemas';
import { validateParams, validateQuery, idParamSchema } from '../../shared/validation/zod';
import { formatListResponse, formatResponse } from '../../shared/api/response';
import { requirePermission } from '../../shared/auth/require-permission';

export async function bomsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preValidation: [validateQuery(bomQuerySchema)],
      preHandler: [requirePermission('boms:read')],
    },
    async (request, reply) => {
      const query = request.query as BOMQuery;
      const { total, data } = await BOMsService.list(request.organizationId!, query);
      return reply
        .status(200)
        .send(formatListResponse(data, { page: query.page, pageSize: query.pageSize, total }, request.requestId));
    }
  );

  app.get(
    '/:id',
    {
      preValidation: [validateParams(idParamSchema)],
      preHandler: [requirePermission('boms:read')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const bom = await BOMsService.findById(request.organizationId!, id);
      return reply.status(200).send(formatResponse(bom, request.requestId));
    }
  );
}

export default bomsRoutes;
