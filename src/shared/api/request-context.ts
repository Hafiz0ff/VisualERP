import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    organizationId?: string;
    requestId: string;
  }
}
