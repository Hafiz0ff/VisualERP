import { FastifyInstance } from 'fastify';
import { SuppliersService } from './suppliers.service';
import { createSupplierSchema, updateSupplierSchema, supplierQuerySchema, CreateSupplierInput, SupplierQuery, UpdateSupplierInput } from './suppliers.schemas';
import { validateBody, validateParams, validateQuery } from '../../shared/validation/zod';
import { idParamSchema } from '../../shared/validation/zod';
import { formatResponse, formatListResponse } from '../../shared/api/response';

export async function suppliersRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preValidation: [validateQuery(supplierQuerySchema)] },
    async (request, reply) => {
      const query = request.query as SupplierQuery;
      const { total, data } = await SuppliersService.list(request.organizationId!, query);
      return reply.status(200).send(
        formatListResponse(data, { page: query.page, pageSize: query.pageSize, total }, request.requestId)
      );
    }
  );

  app.post(
    '/',
    { preValidation: [validateBody(createSupplierSchema)] },
    async (request, reply) => {
      const supplier = await SuppliersService.create(request.organizationId!, request.body as CreateSupplierInput);
      return reply.status(201).send(formatResponse(supplier, request.requestId));
    }
  );

  app.get(
    '/:id',
    { preValidation: [validateParams(idParamSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const supplier = await SuppliersService.findById(request.organizationId!, id);
      return reply.status(200).send(formatResponse(supplier, request.requestId));
    }
  );

  app.patch(
    '/:id',
    { preValidation: [validateParams(idParamSchema), validateBody(updateSupplierSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const supplier = await SuppliersService.update(request.organizationId!, id, request.body as UpdateSupplierInput);
      return reply.status(200).send(formatResponse(supplier, request.requestId));
    }
  );
}
export default suppliersRoutes;
