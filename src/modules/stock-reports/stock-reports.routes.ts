import { FastifyInstance } from 'fastify';
import { StockReportsService } from './stock-reports.service';
import {
  stockBalanceQuerySchema,
  StockBalanceQuery,
  stockBalanceByItemQuerySchema,
  StockBalanceByItemQuery,
  stockBalanceByLocationQuerySchema,
  StockBalanceByLocationQuery,
  itemIdParamSchema,
  ItemIdParam,
  locationIdParamSchema,
  LocationIdParam,
  stockMovementQuerySchema,
  StockMovementQuery,
  stockBatchQuerySchema,
  StockBatchQuery,
  lowStockQuerySchema,
} from './stock-reports.schemas';
import { validateParams, validateQuery } from '../../shared/validation/zod';
import { requirePermission } from '../../shared/auth/require-permission';
import { formatResponse, formatListResponse } from '../../shared/api/response';

export async function stockReportsRoutes(app: FastifyInstance) {
  // GET /balances - paginated stock balances across all locations
  app.get(
    '/balances',
    {
      preValidation: [validateQuery(stockBalanceQuerySchema)],
      preHandler: [requirePermission('stock_reports:read')],
    },
    async (request, reply) => {
      const query = request.query as StockBalanceQuery;
      const { total, data } = await StockReportsService.getStockBalances(
        request.organizationId!,
        query
      );
      return reply
        .status(200)
        .send(
          formatListResponse(
            data,
            { page: query.page, pageSize: query.pageSize, total },
            request.requestId
          )
        );
    }
  );

  // GET /balances/by-item/:itemId - per-location balances for a single item
  app.get(
    '/balances/by-item/:itemId',
    {
      preValidation: [
        validateParams(itemIdParamSchema),
        validateQuery(stockBalanceByItemQuerySchema),
      ],
      preHandler: [requirePermission('stock_reports:read')],
    },
    async (request, reply) => {
      const { itemId } = request.params as ItemIdParam;
      const query = request.query as StockBalanceByItemQuery;
      const result = await StockReportsService.getStockBalancesByItem(
        request.organizationId!,
        itemId,
        query
      );
      return reply.status(200).send(formatResponse(result, request.requestId));
    }
  );

  // GET /balances/by-location/:locationId - item balances for a single location
  app.get(
    '/balances/by-location/:locationId',
    {
      preValidation: [
        validateParams(locationIdParamSchema),
        validateQuery(stockBalanceByLocationQuerySchema),
      ],
      preHandler: [requirePermission('stock_reports:read')],
    },
    async (request, reply) => {
      const { locationId } = request.params as LocationIdParam;
      const query = request.query as StockBalanceByLocationQuery;
      const result = await StockReportsService.getStockBalancesByLocation(
        request.organizationId!,
        locationId,
        query
      );
      return reply.status(200).send(formatResponse(result, request.requestId));
    }
  );

  // GET /movements - paginated stock movements with rich filtering
  app.get(
    '/movements',
    {
      preValidation: [validateQuery(stockMovementQuerySchema)],
      preHandler: [requirePermission('stock_movements:read')],
    },
    async (request, reply) => {
      const query = request.query as StockMovementQuery;
      const { total, data } = await StockReportsService.getStockMovements(
        request.organizationId!,
        query
      );
      return reply
        .status(200)
        .send(
          formatListResponse(
            data,
            { page: query.page, pageSize: query.pageSize, total },
            request.requestId
          )
        );
    }
  );

  // GET /batches - paginated stock batches
  app.get(
    '/batches',
    {
      preValidation: [validateQuery(stockBatchQuerySchema)],
      preHandler: [requirePermission('stock_batches:read')],
    },
    async (request, reply) => {
      const query = request.query as StockBatchQuery;
      const { total, data } = await StockReportsService.getStockBatches(
        request.organizationId!,
        query
      );
      return reply
        .status(200)
        .send(
          formatListResponse(
            data,
            { page: query.page, pageSize: query.pageSize, total },
            request.requestId
          )
        );
    }
  );

  // GET /low-stock - documented limitation until minimum stock thresholds exist
  app.get(
    '/low-stock',
    {
      preValidation: [validateQuery(lowStockQuerySchema)],
      preHandler: [requirePermission('stock_reports:read')],
    },
    async (request, reply) => {
      const items = await StockReportsService.getLowStockItems();
      return reply.status(200).send(formatResponse(items, request.requestId));
    }
  );
}
export default stockReportsRoutes;
