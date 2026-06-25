import { FastifyInstance } from 'fastify';
import { DashboardService } from './dashboard.service';
import { dashboardQuerySchema } from './dashboard.schemas';
import { requirePermission } from '../../shared/auth/require-permission';
import { formatResponse } from '../../shared/api/response';
import { validateQuery } from '../../shared/validation/zod';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preValidation: [validateQuery(dashboardQuerySchema)],
      preHandler: [requirePermission('dashboard:read')],
    },
    async (request, reply) => {
      const data = await DashboardService.getDashboardData(request.organizationId!);
      return reply.status(200).send(formatResponse(data, request.requestId));
    }
  );
}
export default dashboardRoutes;
