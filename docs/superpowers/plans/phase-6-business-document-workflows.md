# Phase 6 Business Document Workflows Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first three stock-affecting business document workflows: Purchase Receipts, location Transfers, and Write-offs. These must utilize the transaction manager, document lifecycles, sequential numbering, stock availability checks, and audit logging services established in Phase 5.

---

## Checklist

- [x] Integrate `IdempotencyConflictError` check into `IdempotencyService` and create generic `idempotency.hooks.ts`.
- [x] Implement Purchase Receipts CRUD, post, and cancel validations (`src/modules/purchase-receipts`).
- [x] Implement location-to-location Transfers checking stock availability (`src/modules/transfers`).
- [x] Implement Write-offs removing stock and checking availability (`src/modules/write-offs`).
- [x] Register new routing endpoints in the main Fastify server (`src/app.ts`).
- [x] Update documentation matching the Phase 6 delivery.
- [x] Run verification to ensure TypeScript build, Prisma validation/generation, and diff checks pass.

## Expected Files

- `src/shared/idempotency/idempotency.hooks.ts`
- `src/modules/purchase-receipts/purchase-receipts.schemas.ts`
- `src/modules/purchase-receipts/purchase-receipts.service.ts`
- `src/modules/purchase-receipts/purchase-receipts.routes.ts`
- `src/modules/transfers/transfers.schemas.ts`
- `src/modules/transfers/transfers.service.ts`
- `src/modules/transfers/transfers.routes.ts`
- `src/modules/write-offs/write-offs.schemas.ts`
- `src/modules/write-offs/write-offs.service.ts`
- `src/modules/write-offs/write-offs.routes.ts`
- `docs/superpowers/plans/phase-6-business-document-workflows.md`

## Acceptance Criteria

Phase 6 is accepted only if:
- All new routes (Purchase Receipts, Transfers, Write-offs) exist and compile cleanly;
- Documents start as `DRAFT` and do not affect stock;
- Mutating actions (/post and /cancel) execute inside database transactions, updating stock movements through `StockLedgerService` and creating audit logs;
- Reversing cancellation stock movement logic neutralizes posted documents;
- Idempotency key checks block double-submits and cache responses;
- Build, Prisma validation, and Prisma client generation pass successfully.
- Live database migration/seed execution is environment-dependent and must be reported separately.

## Verification Notes

- `npm run build`: passed.
- `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/visualerp?schema=public' npx prisma validate`: passed.
- `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/visualerp?schema=public' npx prisma generate`: passed.
- `git diff --check`: passed.
- Live database seed was attempted but did not complete because the required local `postgres:postgres` database access is not available in the current PostgreSQL instance (`psql` reports missing `postgres` role over localhost, while Prisma seed reports access denied for `visualerp.public`).

## Restrictions

- Do not implement production orders.
- Do not implement shipments.
- Do not implement inventory audits.
- Do not implement dashboard.
- Do not modify the frontend prototype archive.
- Do not bypass `StockLedgerService` for stock ledger adjustments.
