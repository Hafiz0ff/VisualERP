import { FastifyInstance } from 'fastify';
import { LocationsService } from './locations.service';
import { createLocationSchema, updateLocationSchema, locationQuerySchema, CreateLocationInput, LocationQuery, UpdateLocationInput } from './locations.schemas';
import { validateBody, validateParams, validateQuery } from '../../shared/validation/zod';
import { idParamSchema } from '../../shared/validation/zod';
import { formatResponse, formatListResponse } from '../../shared/api/response';

export async function locationsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preValidation: [validateQuery(locationQuerySchema)] },
    async (request, reply) => {
      const query = request.query as LocationQuery;
      const { total, data } = await LocationsService.list(request.organizationId!, query);
      return reply.status(200).send(
        formatListResponse(data, { page: query.page, pageSize: query.pageSize, total }, request.requestId)
      );
    }
  );

  app.post(
    '/',
    { preValidation: [validateBody(createLocationSchema)] },
    async (request, reply) => {
      const location = await LocationsService.create(request.organizationId!, request.body as CreateLocationInput);
      return reply.status(201).send(formatResponse(location, request.requestId));
    }
  );

  app.get(
    '/:id',
    { preValidation: [validateParams(idParamSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const location = await LocationsService.findById(request.organizationId!, id);
      return reply.status(200).send(formatResponse(location, request.requestId));
    }
  );

  app.patch(
    '/:id',
    { preValidation: [validateParams(idParamSchema), validateBody(updateLocationSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const location = await LocationsService.update(request.organizationId!, id, request.body as UpdateLocationInput);
      return reply.status(200).send(formatResponse(location, request.requestId));
    }
  );
}
export default locationsRoutes;
