import { FastifyInstance } from 'fastify';
import { formatResponse } from '../../shared/api/response';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    return reply.status(200).send(
      formatResponse({ status: 'ok' }, request.requestId)
    );
  });
}
export default healthRoutes;
