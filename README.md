<div align="center">
  <h1>VisualERP</h1>
  <p><strong>Lightweight, visual, modular ERP for small manufacturing businesses.</strong></p>
  <p>Documentation-first foundation for a modern alternative to Excel-heavy and old 1C-style workflows.</p>
  <p>
    <img src="https://img.shields.io/badge/status-phase%2011%20complete-1f6feb?style=for-the-badge" alt="Phase 11 Complete" />
    <img src="https://img.shields.io/badge/architecture-modular%20monolith-0a7f5a?style=for-the-badge" alt="Modular Monolith" />
    <img src="https://img.shields.io/badge/focus-small%20manufacturing-c26d00?style=for-the-badge" alt="Small Manufacturing" />
    <img src="https://img.shields.io/badge/language-Russian%20docs%20%2B%20English%20tech-5b4b8a?style=for-the-badge" alt="Russian Docs and English Tech" />
  </p>
</div>

## Overview

VisualERP is being designed as a **universal mini-ERP** for small production companies that need operational clarity without enterprise overhead.

The first prototype context is a **dry construction mixes workshop**, but the system architecture is intentionally broader. The target product is a reusable operational platform for multiple industries:

- dry construction mixes;
- food production;
- dairy;
- meat processing;
- snacks;
- furniture;
- tools;
- textile;
- packaging;
- other small workshops.

## Описание На Русском

**VisualERP** — это лёгкая и наглядная система управления для небольших производственных компаний. Она помогает заменить разрозненные таблицы, ручной учёт и перегруженные старые решения понятным рабочим пространством для склада, производства, списаний, отгрузок и контроля истории операций.

Проект строится как универсальная основа: сначала отрабатывается пример цеха сухих строительных смесей, но внутренняя модель не привязана к одной отрасли. Те же принципы подходят для пищевого производства, молочной продукции, мебели, упаковки, текстиля и других небольших мастерских.

Главная идея VisualERP:

- видеть реальные остатки по складам и партиям;
- оформлять поступления, перемещения и списания через строгие документы;
- хранить понятную историю действий;
- разделять права сотрудников;
- подстраивать названия и состав разделов под конкретное производство;
- не допускать расхождения между документами и складскими остатками.

Текущая версия уже содержит основу серверной части, первые складские документы, производственные заказы и отгрузки. Остатки считаются не вручную, а по журналу проведённых движений, поэтому система сохраняет проверяемую историю вместо скрытого изменения чисел.

## Product Positioning

VisualERP is a lightweight, visual, modular alternative to:

- fragmented Excel-based accounting;
- manual stock and production tracking;
- overloaded legacy 1C-style workflows for small teams.

The product aims to make daily operations easier for companies that need:

- clear stock visibility;
- traceable production flows;
- structured write-offs and corrections;
- role-based access;
- auditable operational history.

## Core Product Formula

```txt
VisualERP Core
+ Industry Profiles
+ Optional Modules
```

This principle is the main architectural guardrail of the project.

## First Business Use Case

The first prototype is based on a dry construction mixes workshop with needs around:

- raw materials;
- recipe-driven production;
- warehouse-to-workshop transfers;
- finished goods output;
- shipments;
- write-offs;
- reporting and auditability.

This is the initial profile, not the long-term system boundary.

## Universal Domain Direction

The core model uses **industry-agnostic ERP entities**:

- `Item`
- `ItemCategory`
- `Unit`
- `Warehouse`
- `Workshop`
- `StockBatch`
- `StockMovement`
- `BOM`
- `ProductionOrder`
- `Shipment`
- `WriteOff`
- `InventoryAudit`
- `User`
- `Role`
- `AuditLog`

Industry-specific wording will be configurable through `IndustryProfile`.

## Core Business Flow

```txt
Purchase receipt
-> Warehouse stock
-> Transfer to workshop
-> Workshop stock
-> Production order
-> Material consumption
-> Finished goods output
-> Finished goods stock
-> Shipment
-> Write-off / correction
-> Reports
-> Audit log
```

## Planned Modules

### MVP Modules

- Warehouse
- Production
- BOM / Recipe
- Shipments
- Write-offs
- Reports
- Audit Log
- Users and Roles

### Future Optional Modules

- Quality Control
- Finance
- CRM
- Equipment Maintenance
- Payroll
- Multi-branch support
- Offline sync
- Barcode / QR support
- Mobile warehouse app

## Current Status

| Area | Status |
| --- | --- |
| Repository foundation | Complete |
| Product documentation | Complete for Phase 10 |
| Architecture direction | Defined and aligned with the domain model |
| Domain model | Complete |
| Database schema foundation | Complete |
| API contract | Complete |
| Backend implementation | Dashboard and MVP Demo Flow complete, Frontend integration blueprint ready |
| Initial Prisma schema | Complete |
| Frontend prototype archive | Preserved |
| Next recommended phase | Phase 11 - Frontend API Client and Read-Only Integration |

## Planned Tech Direction

The repository is currently documentation-first. The planned implementation direction is:

- Frontend: React + TypeScript
- Backend: Node.js + TypeScript
- Architecture: Modular monolith
- API: JSON/REST
- Database: PostgreSQL
- Validation: Zod
- Testing: unit, integration, API, permission, audit, and business-flow coverage

Framework-level decisions can be finalized in the next phases now that the domain model is locked.

## Repository Map

| Path | Purpose |
| --- | --- |
| [`docs/PROJECT-CONTEXT.md`](docs/PROJECT-CONTEXT.md) | Why the project exists and what problem it solves |
| [`docs/STATUS.md`](docs/STATUS.md) | Current repository and phase status |
| [`docs/product/`](docs/product) | Product requirements, roles, processes, modules |
| [`docs/architecture/`](docs/architecture) | System architecture, conceptual data model, API, security, offline, finance |
| [`docs/engineering/`](docs/engineering) | Engineering rules, testing, performance, UI principles |
| [`docs/migration/`](docs/migration) | Excel-to-VisualERP migration thinking |
| [`docs/roadmap/`](docs/roadmap) | Delivery roadmap from documentation to pilot |
| [`docs/decisions/`](docs/decisions) | ADRs and structural decisions |

## Documentation-First Workflow

Before adding implementation code:

1. Read [`docs/PROJECT-CONTEXT.md`](docs/PROJECT-CONTEXT.md).
2. Read [`docs/product/PRODUCT-SPEC.md`](docs/product/PRODUCT-SPEC.md).
3. Read [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md).
4. Read [`docs/engineering/DEVELOPMENT-RULES.md`](docs/engineering/DEVELOPMENT-RULES.md).
5. Confirm the requested work matches the current phase in [`TASKS.md`](TASKS.md).

## AI Agent Working Agreement

All AI coding agents working in this repository must follow these rules:

- read documentation before coding;
- do not invent business rules;
- do not hardcode industry-specific logic into the core;
- keep the modular architecture intact;
- prefer strict TypeScript and small focused files;
- update [`TASKS.md`](TASKS.md) and [`docs/STATUS.md`](docs/STATUS.md) when a phase changes;
- update `README.md` after every major spec, major phase, or significant scope change so the GitHub landing page always reflects the real project state.

Supporting instructions:

- [`AGENTS.md`](AGENTS.md)
- [`CLAUDE.md`](CLAUDE.md)
- [`CODEX.md`](CODEX.md)

## Phase Progress

### Phase 0

Phase 0 established:

- repository structure;
- product context;
- universal ERP direction;
- modular architecture baseline;
- engineering rules;
- AI-agent instructions;
- roadmap and ADR foundation.

It intentionally does **not** include:

- production backend code;
- final database schema;
- frontend redesign.

### Phase 1

Phase 1 established:

- universal domain model and ubiquitous language;
- multi-organization and membership concepts;
- industry profile, terminology, and module configuration concepts;
- movement-based stock accounting rules;
- batch traceability, BOM versioning, and document lifecycle rules;
- conceptual API and security updates aligned with the model.

### Phase 2

Phase 2 established:

- initial PostgreSQL + Prisma project tooling;
- explicit relational schema for organizations, access, catalog, stock, production, shipments, write-offs, audits, and audit log;
- UUID keys, tenant scoping, enums, indexes, and document lifecycle timestamps;
- minimal idempotent seed data for the demo organization and dry-mixes profile;
- database architecture documentation aligned with the domain model.

### Phase 3

Phase 3 established:

- REST API contract overview and endpoint groups;
- standard success, paginated list, and error envelopes;
- business document lifecycle action endpoints;
- conceptual DTOs aligned with the Prisma schema;
- standardized error catalog and permission matrix;
- idempotency rules for stock-affecting actions.

### Phase 4

Phase 4 established:

- Fastify application shell, UUID request tracking, and centralized error hooks;
- multi-tenant context extraction scoped to the `X-Organization-Id` header;
- database-backed idempotency service utilizing `IdempotencyKey` table;
- Zod pre-validation hook structure;
- CRUD routes and service queries for the 8 core master data collections.

### Phase 5

Phase 5 established:

- Prisma database transactions manager and scoped base repository helpers;
- reusable document lifecycle validation services and concurrency-safe prefix sequential document numbering;
- dynamic stock ledger calculations, stock availability validation checks, and MANUAL/FIFO/FEFO batch allocation resolvers;
- synchronous, transaction-safe in-process Event Bus.

### Phase 6

Phase 6 established:

- full REST API CRUD, post, and cancel endpoints for Purchase Receipts, Transfers, and Write-offs;
- strict document lifecycle state transitions using transactional operations;
- dynamic stock ledger adjustments and batch allocations;
- request idempotency hooks;
- compensating cancellation checks preventing negative stock balances on reversals.

### Phase 7

Phase 7 established:

- full REST API CRUD, start, complete, and cancel endpoints for Production Orders, linking them to BOM-based or explicit consumption and finished goods outputs;
- full REST API CRUD, ship, and cancel endpoints for Shipments, matching customer sales;
- dynamic FEFO/FIFO stock batch resolvers and availability checks for production material consumption and shipments;
- compensating cancellation checks preventing negative stock levels of output products and shipped items;
- multi-tenant scoping and idempotency key checks.

### Phase 8

Phase 8 established:

- full REST API CRUD, count, approve, and cancel endpoints for Inventory Audits, enabling physical stock counts reconciliation;
- discrepancy-based stock ledger adjustments using `INVENTORY_ADJUSTMENT` movement types;
- read-only stock reports including matrix balance sheets, per-item, and per-location status pages;
- historical movement logs with filtering, active batch registers, and a safe documented low-stock limitation until minimum stock thresholds are modeled;
- permission scopes and idempotency hooks.

### Phase 9

Phase 9 established:

- real-time dashboard endpoint (`GET /api/dashboard`) returning stock summaries (dynamically aggregated from movements), production/shipment/write-off monthly counts, pending document actions, and recent audit events;
- database seeding improvements to include partners (Supplier and Customer) for end-to-end flows;
- comprehensive end-to-end MVP Demo Flow guide (`docs/demo/MVP-DEMO-FLOW.md`) describing a verifiable full stock and production cycle with copy-pasteable `curl` commands.

### Phase 10

Phase 10 established:

- comprehensive frontend integration plan (`docs/frontend/FRONTEND-INTEGRATION-PLAN.md`) detailing unified API client design, envelope parsing, and organization scoping;
- screen-by-screen mappings (`docs/frontend/API-SCREEN-MAPPING.md`) linking all 16 prototype views to backend routes, permissions, and loading/empty/error states;
- conceptual DTO data contracts (`docs/frontend/FRONTEND-DATA-CONTRACTS.md`) for all dashboard and document list/detail views;
- frontend state/error guidelines (`docs/frontend/FRONTEND-STATE-AND-ERRORS.md`) and role-based permissions (`docs/frontend/FRONTEND-PERMISSIONS.md`).

## Next Step

**Phase 11 - Frontend API Client and Read-Only Integration**

The next phase should define:

- Implementing the unified Axios/fetch API client, global error handler, and react hooks in the frontend project;
- Connecting read-only lists and dashboard cards to the real backend APIs using organizational context.
