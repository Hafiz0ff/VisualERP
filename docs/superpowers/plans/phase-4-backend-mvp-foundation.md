# Phase 4 Backend MVP Foundation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the core backend server infrastructure using Fastify, Prisma, and Zod. Set up request logging, multi-tenancy scoping (via the `X-Organization-Id` header), centralized error handling, audit logging, a database-backed idempotency service, and CRUD dictionary endpoints for the 8 core master data resources.

**Architecture:** Fastify app with modularized routing under `src/modules/`. Input validation is performed at the router preValidation layer using Zod hooks. Shared code is centralized under `src/shared/` to support tenant scoping, error conversions, response formatting, and idempotency tracking.

---

## Checklist

- [x] Configure project and tooling (added Fastify, development scripts, TypeScript settings, and UUID request IDs via Node.js `crypto.randomUUID`).
- [x] Add `IdempotencyKey` model to the Prisma schema (`prisma/schema.prisma`).
- [x] Implement shared response wrappers, error classes, and error handlers (`src/shared/api`, `src/shared/errors`).
- [x] Create input validation validation hooks for Zod (`src/shared/validation`).
- [x] Build database-backed idempotency check service (`src/shared/idempotency`).
- [x] Scaffold permissive authorization checker and audit logging services (`src/shared/auth`, `src/shared/audit`).
- [x] Initialize Fastify routing and request mapping lifecycle in `src/app.ts` and `src/server.ts`.
- [x] Implement Health Check module (`src/modules/health`).
- [x] Implement CRUD/List Dictionary endpoints for Organizations (`src/modules/organizations`).
- [x] Implement CRUD/List Dictionary endpoints for Industry Profiles (`src/modules/industry-profiles`).
- [x] Implement CRUD/List Dictionary endpoints for Units (`src/modules/units`).
- [x] Implement CRUD/List Dictionary endpoints for Item Categories (`src/modules/item-categories`).
- [x] Implement CRUD/List Dictionary endpoints for Items (`src/modules/items`).
- [x] Implement CRUD/List Dictionary endpoints for Locations (`src/modules/locations`).
- [x] Implement CRUD/List Dictionary endpoints for Suppliers (`src/modules/suppliers`).
- [x] Implement CRUD/List Dictionary endpoints for Customers (`src/modules/customers`).
- [x] Run verification checks to confirm Prisma client generation, Prisma schema validation, and TypeScript compilation.

## Expected Files

- `src/app.ts`
- `src/server.ts`
- `src/shared/api/response.ts`
- `src/shared/api/pagination.ts`
- `src/shared/api/request-context.ts`
- `src/shared/errors/app-error.ts`
- `src/shared/errors/error-handler.ts`
- `src/shared/validation/zod.ts`
- `src/shared/auth/auth-context.ts`
- `src/shared/auth/permissions.ts`
- `src/shared/auth/require-permission.ts`
- `src/shared/audit/audit-log.service.ts`
- `src/shared/idempotency/idempotency.service.ts`
- `src/shared/idempotency/idempotency.types.ts`
- `src/modules/health/health.routes.ts`
- `src/modules/organizations/`
- `src/modules/industry-profiles/`
- `src/modules/units/`
- `src/modules/item-categories/`
- `src/modules/items/`
- `src/modules/locations/`
- `src/modules/suppliers/`
- `src/modules/customers/`
- `docs/superpowers/plans/phase-4-backend-mvp-foundation.md`

## Acceptance Criteria

Phase 4 is accepted only if:
- Fastify server starts and listens without error;
- All 8 core master data resources have fully functioning CRUD/List endpoints;
- All endpoints validate incoming inputs strictly using Zod schemas;
- All organization-owned resources require the `X-Organization-Id` header and query only within that tenant context;
- Centralized error handler maps app errors and Zod validation errors to standard JSON envelopes;
- Idempotency checks are supported using the `IdempotencyKey` model;
- Project builds cleanly with no compilation or Prisma schema errors.

## Restrictions

- Do not implement real authentication flows (sign-up, sign-in, JWT verify) yet; use mock context from request headers.
- Do not implement transactional workflows (such as posting receipts, completing orders, or ledger adjustments) in this phase.
- Do not modify the frontend prototype archive.

## Next Step

- **Phase 5 — Transactional Logic & Ledgers**: Implement core business transactions (purchases, transfers, production, shipments), write-off transactions, inventory audits, batch control status, and real stock ledger calculations with strict balance checks.
