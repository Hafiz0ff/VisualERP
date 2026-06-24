<div align="center">
  <h1>VisualERP</h1>
  <p><strong>Lightweight, visual, modular ERP for small manufacturing businesses.</strong></p>
  <p>Documentation-first foundation for a modern alternative to Excel-heavy and old 1C-style workflows.</p>
  <p>
    <img src="https://img.shields.io/badge/status-phase%201%20complete-1f6feb?style=for-the-badge" alt="Phase 1 Complete" />
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
| Product documentation | Complete for Phase 1 |
| Architecture direction | Defined and aligned with the domain model |
| Domain model | Complete |
| Backend implementation | Not started |
| Final database schema | Not started |
| Frontend prototype archive | Preserved |
| Next recommended phase | Phase 2 - Database Schema |

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

## Next Step

**Phase 2 - Database Schema**

The next phase should define:

- concrete Prisma or SQL schema;
- database constraints and indexes;
- validation structures aligned with the domain model;
- seed data for roles, permissions, and industry profiles.
