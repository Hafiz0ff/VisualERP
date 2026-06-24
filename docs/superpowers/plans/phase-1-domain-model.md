# Phase 1 Domain Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a complete, universal domain model and ubiquitous language for VisualERP as a foundation before database schema (Prisma/SQL) or backend API route implementation starts.

**Architecture:** VisualERP Core (multi-tenant context, items, locations, movements) + Industry Profiles (configs, terminology maps) + Optional Modules (warehouse, production, BOM, shipments, write-offs). All quantities and stock balances must be derived dynamically from an immutable, transaction-safe ledger of stock movements.

---

## Scope

- Define universal entities, relationships, statuses, and invariants for the production domain.
- Preserve industry-agnostic terminology while allowing profile-based labels and module toggles.
- Align process, API, security, and engineering documents with the Phase 1 domain decisions.

## Checklist

- [x] Create/update `docs/architecture/DATA-MODEL.md` with the full conceptual entities and relationship definition.
- [x] Create/update `docs/product/BUSINESS-PROCESSES.md` documenting document lifecycle rules, domain-specific statuses, and dynamic balance derivation rules.
- [x] Create/update `docs/product/MODULES.md` describing Core vs. Optional modules, dependency layers, and the enable/disable concept.
- [x] Create/update `docs/architecture/API.md` outlining API standards, endpoints, request payloads, and status codes.
- [x] Create/update `docs/architecture/SECURITY.md` establishing rules for data isolation, granular permissions, role access, and audit log mapping.
- [x] Create/update `docs/engineering/DEVELOPMENT-RULES.md` documenting strict typing, transaction boundaries, validation, and naming constraints.
- [x] Ensure that no industry-specific terminology is hardcoded into the core data model.
- [x] Do not create database migrations, Prisma schemas, frontend redesign code, or Express routes in this phase.

## Expected Files

- `docs/architecture/DATA-MODEL.md`
- `docs/product/BUSINESS-PROCESSES.md`
- `docs/product/MODULES.md`
- `docs/architecture/API.md`
- `docs/architecture/SECURITY.md`
- `docs/engineering/DEVELOPMENT-RULES.md`
- `TASKS.md`
- `docs/STATUS.md`
- `docs/superpowers/plans/phase-1-domain-model.md`

## Acceptance Criteria

Phase 1 is complete only if:
- All core entities (`Organization`, `User`, `Role`, `Permission`, `UserOrganizationMembership`, `IndustryProfile`, `TerminologyConfig`, `ModuleConfig`, `Item`, `ItemCategory`, `Unit`, `UnitConversion`, `Warehouse`, `Workshop`, `StockLocation`, `StockBatch`, `StockMovement`, `BOM`, `ProductionOrder`, `Shipment`, `WriteOff`, `InventoryAudit`, `AuditLog`) are conceptualized and documented;
- Clear state transitions and domain-specific statuses are established;
- Stock movements are specified as the single source of truth for stock balances;
- Multi-tenancy isolation rules are explicitly defined via `organizationId`;
- Dynamic terminology translations are configured through configuration configs without hardcoding in schemas;
- No backend code, Prisma schemas, database migrations, or frontend changes are added to the repo;
- `TASKS.md` and `docs/STATUS.md` are updated.

## Restrictions

- Do not implement backend code or API routes.
- Do not create Prisma schema or SQL migrations.
- Do not install dependencies.
- Do not modify the frontend prototype archive.
- Do not hardcode dry-mix-specific language into the core domain.

## Next Phase

- **Phase 2 — Database Schema**: Define database schema (Prisma/SQL DDL), validation rules (Zod schemas), seed files, and automated database setup scripts.
