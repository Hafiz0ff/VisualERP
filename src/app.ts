import Fastify, { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import './shared/api/request-context'; // Load typing overrides
import { setupErrorHandler } from './shared/errors/error-handler';
import { UnauthorizedError } from './shared/errors/app-error';

// Import module routes
import { healthRoutes } from './modules/health/health.routes';
import { organizationsRoutes } from './modules/organizations/organizations.routes';
import { industryProfilesRoutes } from './modules/industry-profiles/industry-profiles.routes';
import { unitsRoutes } from './modules/units/units.routes';
import { itemCategoriesRoutes } from './modules/item-categories/item-categories.routes';
import { itemsRoutes } from './modules/items/items.routes';
import { locationsRoutes } from './modules/locations/locations.routes';
import { suppliersRoutes } from './modules/suppliers/suppliers.routes';
import { customersRoutes } from './modules/customers/customers.routes';

export function createServer(): FastifyInstance {
  const app = Fastify({
    logger: true,
    genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID(),
  });

  // Global hooks
  app.addHook('onRequest', async (request, reply) => {
    request.requestId = request.id;
    reply.header('X-Request-Id', request.id);

    const orgHeader = request.headers['x-organization-id'];
    const orgId = Array.isArray(orgHeader) ? orgHeader[0] : orgHeader;
    if (orgId) {
      request.organizationId = orgId;
    }
  });

  // Tenant scoping validation hook
  app.addHook('preHandler', async (request) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const isOrganizationsBootstrapRoute =
      (pathname === '/api/organizations' || pathname === '/api/organizations/') &&
      (request.method === 'GET' || request.method === 'POST');

    // Skip organization check for health, industry-profiles, and organizations list/creation
    if (
      pathname.startsWith('/api/health') ||
      pathname.startsWith('/api/industry-profiles') ||
      isOrganizationsBootstrapRoute
    ) {
      return;
    }

    if (!request.organizationId) {
      throw new UnauthorizedError('Organization context required. Please provide X-Organization-Id header.');
    }
  });

  // Register error handler
  setupErrorHandler(app);

  // Register routing groups
  app.register(healthRoutes, { prefix: '/api/health' });
  app.register(organizationsRoutes, { prefix: '/api/organizations' });
  app.register(industryProfilesRoutes, { prefix: '/api/industry-profiles' });
  app.register(unitsRoutes, { prefix: '/api/units' });
  app.register(itemCategoriesRoutes, { prefix: '/api/item-categories' });
  app.register(itemsRoutes, { prefix: '/api/items' });
  app.register(locationsRoutes, { prefix: '/api/locations' });
  app.register(suppliersRoutes, { prefix: '/api/suppliers' });
  app.register(customersRoutes, { prefix: '/api/customers' });

  return app;
}
export default createServer;
