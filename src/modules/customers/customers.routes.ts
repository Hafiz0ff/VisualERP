import { FastifyInstance } from 'fastify';
import { CustomersService } from './customers.service';
import { createCustomerSchema, updateCustomerSchema, customerQuerySchema, CreateCustomerInput, CustomerQuery, UpdateCustomerInput } from './customers.schemas';
import { validateBody, validateParams, validateQuery } from '../../shared/validation/zod';
import { idParamSchema } from '../../shared/validation/zod';
import { formatResponse, formatListResponse } from '../../shared/api/response';

export async function customersRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preValidation: [validateQuery(customerQuerySchema)] },
    async (request, reply) => {
      const query = request.query as CustomerQuery;
      const { total, data } = await CustomersService.list(request.organizationId!, query);
      return reply.status(200).send(
        formatListResponse(data, { page: query.page, pageSize: query.pageSize, total }, request.requestId)
      );
    }
  );

  app.post(
    '/',
    { preValidation: [validateBody(createCustomerSchema)] },
    async (request, reply) => {
      const customer = await CustomersService.create(request.organizationId!, request.body as CreateCustomerInput);
      return reply.status(201).send(formatResponse(customer, request.requestId));
    }
  );

  app.get(
    '/:id',
    { preValidation: [validateParams(idParamSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const customer = await CustomersService.findById(request.organizationId!, id);
      return reply.status(200).send(formatResponse(customer, request.requestId));
    }
  );

  app.patch(
    '/:id',
    { preValidation: [validateParams(idParamSchema), validateBody(updateCustomerSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const customer = await CustomersService.update(request.organizationId!, id, request.body as UpdateCustomerInput);
      return reply.status(200).send(formatResponse(customer, request.requestId));
    }
  );
}
export default customersRoutes;
