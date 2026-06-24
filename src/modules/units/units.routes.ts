import { FastifyInstance } from 'fastify';
import { UnitsService } from './units.service';
import { createUnitSchema, updateUnitSchema, unitQuerySchema, CreateUnitInput, UnitQuery, UpdateUnitInput } from './units.schemas';
import { validateBody, validateParams, validateQuery } from '../../shared/validation/zod';
import { idParamSchema } from '../../shared/validation/zod';
import { formatListResponse, formatResponse } from '../../shared/api/response';

export async function unitsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preValidation: [validateQuery(unitQuerySchema)] },
    async (request, reply) => {
      const query = request.query as UnitQuery;
      const { total, data } = await UnitsService.list(request.organizationId!, query);
      return reply.status(200).send(
        formatListResponse(data, { page: query.page, pageSize: query.pageSize, total }, request.requestId)
      );
    }
  );

  app.post(
    '/',
    { preValidation: [validateBody(createUnitSchema)] },
    async (request, reply) => {
      const unit = await UnitsService.create(request.organizationId!, request.body as CreateUnitInput);
      return reply.status(201).send(formatResponse(unit, request.requestId));
    }
  );

  app.get(
    '/:id',
    { preValidation: [validateParams(idParamSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const unit = await UnitsService.findById(request.organizationId!, id);
      return reply.status(200).send(formatResponse(unit, request.requestId));
    }
  );

  app.patch(
    '/:id',
    { preValidation: [validateParams(idParamSchema), validateBody(updateUnitSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const unit = await UnitsService.update(request.organizationId!, id, request.body as UpdateUnitInput);
      return reply.status(200).send(formatResponse(unit, request.requestId));
    }
  );
}
export default unitsRoutes;
