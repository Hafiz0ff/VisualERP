# VisualERP Architecture

## Recommended Approach

VisualERP should start as a **modular monolith**.

This is the best fit for the current stage because the product is early, the team is small, the domain is still being formalized, and the platform must remain easy to evolve without operational overhead.

## Why Not Microservices Yet

Microservices would add cost before the product has proven boundaries:

- more deployment complexity;
- more integration contracts too early;
- duplicated infrastructure concerns;
- higher debugging and testing overhead;
- harder coordination for AI coding agents and small teams.

For MVP and first client pilots, a modular monolith gives enough separation without artificial distribution.

## Core Direction

The system must be designed as:

`VisualERP Core + Industry Profiles + Optional Modules`

### VisualERP Core

Contains universal production ERP concepts:

- items and categories;
- warehouses and workshops;
- stock movement;
- BOM / recipe;
- production orders;
- shipments;
- write-offs;
- audit log;
- users and permissions.

### Industry Profiles

Industry profiles adapt terminology and defaults without changing the core model.

Examples:

- `Item` can be shown as сырье, ингредиент, материал, готовая продукция, изделие
- `BOM` can be shown as рецептура or состав изделия
- `Workshop` can be shown as цех, участок, производственная зона

### Optional Modules

Additional modules must be enabled by configuration and not by branch-specific rewrites.

## Module Boundaries

Suggested domain boundaries:

- `identity-access`
- `catalog`
- `inventory`
- `production`
- `shipments`
- `write-offs`
- `reporting`
- `audit`
- `configuration`

Each module should own:

- its domain logic;
- its entities and invariants;
- its service interfaces;
- its events or integration points.

## Domain-First Structure

When implementation starts, the codebase should be organized around business capabilities, not only technical layers.

Prefer:

- module-local application logic;
- explicit ports for infrastructure;
- shared types only when truly cross-cutting;
- stable domain vocabulary.

Avoid:

- giant `services` folders with mixed responsibilities;
- global utility layers hiding business logic;
- profile-specific branching inside the core domain.

## Configuration-Driven Terminology

UI labels and some business vocabulary should be configurable via an `IndustryProfile`.

Core code must still keep universal identifiers such as:

- `Item`
- `ItemCategory`
- `Warehouse`
- `Workshop`
- `StockBatch`
- `StockMovement`
- `BOM`
- `ProductionOrder`
- `Shipment`
- `WriteOff`
- `InventoryAudit`
- `AuditLog`

## Planned Repository Direction

The current repository is documentation-first. A future implementation can evolve toward:

- `apps/` for entry points such as web and api
- `modules/` or `packages/` for domain modules
- `docs/` as the long-lived product and architecture source of truth

The exact code layout should be finalized after Phase 1 domain modeling.
