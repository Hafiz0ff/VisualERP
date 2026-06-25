import Fastify, { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import './shared/api/request-context'; // Load typing overrides
import { setupErrorHandler } from './shared/errors/error-handler';
import { UnauthorizedError, ValidationError } from './shared/errors/app-error';

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
import { purchaseReceiptsRoutes } from './modules/purchase-receipts/purchase-receipts.routes';
import { transfersRoutes } from './modules/transfers/transfers.routes';
import { writeOffsRoutes } from './modules/write-offs/write-offs.routes';
import { productionOrdersRoutes } from './modules/production-orders/production-orders.routes';
import { shipmentsRoutes } from './modules/shipments/shipments.routes';
import { inventoryAuditsRoutes } from './modules/inventory-audits/inventory-audits.routes';
import { stockReportsRoutes } from './modules/stock-reports/stock-reports.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    if (!UUID_REGEX.test(request.organizationId)) {
      throw new ValidationError('X-Organization-Id header must be a valid UUID', [
        { header: 'X-Organization-Id' },
      ]);
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
  app.register(purchaseReceiptsRoutes, { prefix: '/api/purchase-receipts' });
  app.register(transfersRoutes, { prefix: '/api/transfers' });
  app.register(writeOffsRoutes, { prefix: '/api/write-offs' });
  app.register(productionOrdersRoutes, { prefix: '/api/production-orders' });
  app.register(shipmentsRoutes, { prefix: '/api/shipments' });
  app.register(inventoryAuditsRoutes, { prefix: '/api/inventory-audits' });
  app.register(stockReportsRoutes, { prefix: '/api/stock' });
  app.register(dashboardRoutes, { prefix: '/api/dashboard' });

  return app;
}
export default createServer;
