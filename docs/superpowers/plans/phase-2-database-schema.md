# Phase 2 Database Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a production-quality, tenant-isolated relational database schema using PostgreSQL and Prisma ORM, along with a seeding script and TypeScript project settings.

**Architecture:** Scoped schema under `Organization` multi-tenancy. Unified `StockLocation` handling both warehousing and manufacturing workshops. Double-entry transaction safety with movements and lines, indices on lookup/foreign keys, and soft-cancellations (no physical deletes for posted records).

---

## Scope

- Translate the approved domain model into a normalized PostgreSQL/Prisma schema.
- Define enums, relations, unique keys, and indexing strategy for tenant-scoped data.
- Add minimal project tooling and seed data required to work with the schema.
- Update schema-related documentation and phase-tracking files.

## Checklist

- [x] Create project dependencies configuration in `package.json`.
- [x] Configure TypeScript settings in `tsconfig.json`.
- [x] Implement the complete Prisma schema in `prisma/schema.prisma` with exact relationships, constraints, enums, and indices.
- [x] Write `prisma/seed.ts` providing standard seed data (Demo tenant, modules, roles, permissions, items, locations, and a sample BOM).
- [x] Initialize the global Prisma Client singleton in `src/db/prisma.ts`.
- [x] Document the schema, tables, and stock principles in `docs/architecture/DATABASE-SCHEMA.md`.
- [x] Align prior documentation in `docs/architecture/DATA-MODEL.md` and `docs/architecture/API.md` with schema mappings.
- [x] Update status files `docs/STATUS.md` and `TASKS.md` marking Phase 2 as complete.

## Expected Files

- `package.json`
- `tsconfig.json`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/db/prisma.ts`
- `docs/architecture/DATABASE-SCHEMA.md`
- `docs/superpowers/plans/phase-2-database-schema.md`

## Acceptance Criteria

Phase 2 is accepted only if:
- `prisma/schema.prisma` validates successfully with `DATABASE_URL` configured;
- All core entities, enums, indices, unique keys, and relations are explicitly defined;
- Multi-tenancy isolation (`organizationId`) is enforced on all tenant-owned models;
- Seed file `prisma/seed.ts` compile successfully and represents a realistic dry construction mixes starter dataset;
- All documentation files are updated/created;
- No backend controllers, API endpoints, authentication middlewares, or frontend changes are introduced.

## Restrictions

- Do not implement REST API routes or controllers.
- Do not implement UI changes.
- Do not build business services yet.
- Do not add authentication implementation yet.
- Do not modify the frontend prototype archive.
- Do not split the system into microservices.

## Next Step

- **Phase 3 — API Contract**: Define strict JSON request/response schema specifications and HTTP contracts (Zod, Swagger/OpenAPI, or equivalent specs) for all modules.
