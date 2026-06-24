# Phase 3 API Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the complete, detailed API contract specifications, response formatting envelopes, idempotency key designs, permission mappings, and error code structures for VisualERP before code or route implementation starts.

**Architecture:** REST-style endpoints scoped to tenant isolation (`X-Organization-Id` context), mapping 23 endpoint groups. Explicit POST action endpoints for state transitions (`/post`, `/cancel`, `/ship`, `/complete`, `/approve`). Immutability constraints and dynamic balances returned via ledger query models.

---

## Checklist

- [x] Create API errors specification in `docs/architecture/API-ERRORS.md` with HTTP statuses, example payloads, and catalog mappings.
- [x] Create API permissions registry in `docs/architecture/API-PERMISSIONS.md` detailing permission strings and role assignments.
- [x] Create the comprehensive REST API contracts, envelopes, filters, and DTO layouts in `docs/architecture/API-CONTRACT.md`.
- [x] Create the Phase 3 plan details in `docs/superpowers/plans/phase-3-api-contract.md`.
- [x] Update `docs/architecture/API.md` to serve as a linked overview for contract files.
- [x] Align `docs/product/BUSINESS-PROCESSES.md` with explicit POST lifecycle endpoints.
- [x] Verify database models align in `docs/architecture/DATABASE-SCHEMA.md`.
- [x] Add developer API guidelines to `docs/engineering/DEVELOPMENT-RULES.md`.
- [x] Create future integration/e2e api testing scopes in `docs/engineering/TESTING-STRATEGY.md`.
- [x] Update status files `docs/STATUS.md` and `TASKS.md` marking Phase 3 as complete.

## Expected Files

- `docs/architecture/API.md`
- `docs/architecture/API-CONTRACT.md`
- `docs/architecture/API-ERRORS.md`
- `docs/architecture/API-PERMISSIONS.md`
- `docs/architecture/DATABASE-SCHEMA.md`
- `docs/product/BUSINESS-PROCESSES.md`
- `docs/engineering/DEVELOPMENT-RULES.md`
- `docs/engineering/TESTING-STRATEGY.md`
- `docs/STATUS.md`
- `TASKS.md`
- `docs/superpowers/plans/phase-3-api-contract.md`

## Acceptance Criteria

Phase 3 is accepted only if:
- API contracts define success/error envelopes and common list filters;
- 23 required endpoint groups are covered;
- Explicit action endpoints (`/post`, `/ship`, `/complete`, `/approve`, `/cancel`) exist for all business documents;
- DTO fields match standard database schema mappings;
- Catalog of all 16 error codes is specified with example bodies;
- Permission format (`module:action`) and role-permission matrices are detailed;
- Idempotency-Key headers are planned for all mutations;
- No TypeScript code controllers, routers, or database migrations are added.

## Restrictions

- Do not implement API routes, controllers, services, or TypeScript DTO files.
- Do not install new dependencies.
- Do not modify the frontend prototype.
- Do not change the Prisma schema unless a Phase 2 defect is discovered and documented.

## Next Step

- **Phase 4 — Backend MVP Foundation**: Initialize backend framework (Express/Next.js routes), implement authentication middleware, context parsing for multi-tenancy, setup Zod validators, and deploy the database schema to verify seeds.
