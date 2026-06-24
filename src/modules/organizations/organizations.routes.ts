import { FastifyInstance } from 'fastify';
import { OrganizationsService } from './organizations.service';
import { createOrganizationSchema, updateOrganizationSchema, organizationQuerySchema, CreateOrganizationInput, OrganizationQuery, UpdateOrganizationInput } from './organizations.schemas';
import { validateBody, validateParams, validateQuery } from '../../shared/validation/zod';
import { idParamSchema } from '../../shared/validation/zod';
import { formatListResponse, formatResponse } from '../../shared/api/response';
import { OrganizationScopeViolationError } from '../../shared/errors/app-error';

export async function organizationsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preValidation: [validateQuery(organizationQuerySchema)] },
    async (request, reply) => {
      const query = request.query as OrganizationQuery;
      const { total, data } = await OrganizationsService.list(query);
      return reply.status(200).send(
        formatListResponse(data, { page: query.page, pageSize: query.pageSize, total }, request.requestId)
      );
    }
  );

  app.post(
    '/',
    { preValidation: [validateBody(createOrganizationSchema)] },
    async (request, reply) => {
      const org = await OrganizationsService.create(request.body as CreateOrganizationInput);
      return reply.status(201).send(formatResponse(org, request.requestId));
    }
  );

  app.get(
    '/:id',
    { preValidation: [validateParams(idParamSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      if (request.organizationId !== id) {
        throw new OrganizationScopeViolationError();
      }
      const org = await OrganizationsService.findById(id);
      return reply.status(200).send(formatResponse(org, request.requestId));
    }
  );

  app.patch(
    '/:id',
    { preValidation: [validateParams(idParamSchema), validateBody(updateOrganizationSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      if (request.organizationId !== id) {
        throw new OrganizationScopeViolationError();
      }
      const org = await OrganizationsService.update(id, request.body as UpdateOrganizationInput);
      return reply.status(200).send(formatResponse(org, request.requestId));
    }
  );
}
export default organizationsRoutes;
