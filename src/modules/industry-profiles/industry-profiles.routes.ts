import { FastifyInstance } from 'fastify';
import { IndustryProfilesService } from './industry-profiles.service';
import { createIndustryProfileSchema, updateIndustryProfileSchema, codeParamSchema, industryProfileQuerySchema, CreateIndustryProfileInput, IndustryProfileQuery, UpdateIndustryProfileInput } from './industry-profiles.schemas';
import { validateBody, validateParams, validateQuery } from '../../shared/validation/zod';
import { formatListResponse, formatResponse } from '../../shared/api/response';

export async function industryProfilesRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preValidation: [validateQuery(industryProfileQuerySchema)] },
    async (request, reply) => {
      const query = request.query as IndustryProfileQuery;
      const { total, data } = await IndustryProfilesService.list(query);
      return reply.status(200).send(
        formatListResponse(data, { page: query.page, pageSize: query.pageSize, total }, request.requestId)
      );
    }
  );

  app.post(
    '/',
    { preValidation: [validateBody(createIndustryProfileSchema)] },
    async (request, reply) => {
      const profile = await IndustryProfilesService.create(request.body as CreateIndustryProfileInput);
      return reply.status(201).send(formatResponse(profile, request.requestId));
    }
  );

  app.get(
    '/:id',
    { preValidation: [validateParams(codeParamSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const profile = await IndustryProfilesService.findByCode(id);
      return reply.status(200).send(formatResponse(profile, request.requestId));
    }
  );

  app.patch(
    '/:id',
    { preValidation: [validateParams(codeParamSchema), validateBody(updateIndustryProfileSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const profile = await IndustryProfilesService.update(id, request.body as UpdateIndustryProfileInput);
      return reply.status(200).send(formatResponse(profile, request.requestId));
    }
  );
}
export default industryProfilesRoutes;
