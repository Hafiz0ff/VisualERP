# Phase 5 Backend Infrastructure Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the backend transaction manager, repositories, document lifecycle invariants, concurrency-safe document number generation, dynamic stock ledger services, batch resolver engines, and transaction-safe domain event buses.

---

## Checklist

- [x] Add `DocumentSequence` model to `prisma/schema.prisma`.
- [x] Implement transactional helper `runInTransaction` in `src/shared/db/transaction.ts`.
- [x] Create base repository `BaseRepository` in `src/shared/repositories/base-repository.ts`.
- [x] Create domain validation helpers in `src/shared/domain/domain-validation.ts`.
- [x] Create document lifecycle services and common type mappings in `src/modules/documents/` and export to shared domain.
- [x] Implement safe document sequence number generator in `src/modules/documents/document-number.service.ts`.
- [x] Implement synchronously dispatched Event Bus in `src/shared/domain/event-bus.ts`.
- [x] Update audit service `AuditLogService` to support transactional client hooks.
- [x] Develop Stock Ledger Service foundation mapping draft, post, and cancel movements and dynamic balances.
- [x] Develop Stock Availability Service checking quantities and preventing negatives.
- [x] Develop Batch Resolver Service supporting MANUAL, FIFO, and FEFO sorting.
- [x] Complete documentation alignment across README, Status, Tasks, schemas, API contracts, rules, and testing strategies.
- [x] Run verification to confirm TypeScript build, Prisma schema validation, Prisma client generation, and git diff check.
- [ ] Apply database migration or `db push` against the required local PostgreSQL URL. Attempted locally, but blocked because `postgresql://postgres:postgres@localhost:5432/visualerp` fails with `FATAL: role "postgres" does not exist`.

## Expected Files

- `src/shared/db/transaction.ts`
- `src/shared/repositories/base-repository.ts`
- `src/shared/domain/domain-validation.ts`
- `src/shared/domain/document-lifecycle.ts`
- `src/shared/domain/document-number.ts`
- `src/shared/domain/domain-event.ts`
- `src/shared/domain/event-bus.ts`
- `src/modules/documents/document.types.ts`
- `src/modules/documents/document-lifecycle.service.ts`
- `src/modules/documents/document-number.service.ts`
- `src/modules/stock/stock.types.ts`
- `src/modules/stock/stock-ledger.service.ts`
- `src/modules/stock/stock-availability.service.ts`
- `src/modules/stock/batch-resolver.service.ts`
- `docs/architecture/BACKEND-INFRASTRUCTURE.md`
- `docs/architecture/STOCK-LEDGER.md`
- `docs/superpowers/plans/phase-5-backend-infrastructure.md`

## Acceptance Criteria

Phase 5 is accepted only if:
- All 11 shared/module primitives compile cleanly with `npm run build`;
- Prisma schema validates and includes `DocumentSequence`;
- Stock balances are derived dynamically from posted ledger lines;
- No complete business document posting flows are implemented;
- All documentation files are aligned.

## Verification Notes

- `npm run build`: passed.
- `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/visualerp?schema=public' npx prisma validate`: passed.
- `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/visualerp?schema=public' npx prisma generate`: passed.
- `git diff --check`: passed.
- `npx prisma migrate dev --name add_document_sequences`: attempted, but blocked by the local PostgreSQL role configuration noted above.
