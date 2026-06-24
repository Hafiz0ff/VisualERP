# Conceptual Data Model

This document defines the initial conceptual model for VisualERP. It is intentionally **not** a final Prisma schema and should be refined in Phase 1 and Phase 2.

## Modeling Principles

- Keep entity names industry-agnostic.
- Separate reference data from transactional data.
- Preserve traceability for stock and production actions.
- Allow future profile-based terminology without changing core entity names.

## Core Entities

### Organization

Represents the owning business entity or legal unit using the system.

Key responsibilities:

- owns data;
- defines base settings such as currency and locale;
- can later own multiple branches or sites.

### User

Represents a system actor.

Key fields conceptually:

- identity data;
- status;
- assigned roles;
- organization membership.

### Role

Represents a named access bundle such as `Warehouse Manager` or `Auditor`.

### Permission

Represents granular actions such as create receipt, approve write-off, view financial data, or manage users.

### Item

Represents any material, ingredient, packaging, semi-finished, or finished product.

### ItemCategory

Groups items for navigation, reporting, and policy rules.

### Unit

Defines measurement units such as kg, ton, piece, liter, box, or pallet.

### Warehouse

Represents a storage location where stock is received, stored, counted, and shipped.

### Workshop

Represents a production area where materials are consumed and finished goods are produced.

### StockBatch

Represents a logical stock layer or traceable batch where the business needs quantity lineage.

### StockMovement

Represents quantity movement between states or locations.

Examples:

- receipt;
- transfer;
- consumption;
- output;
- shipment;
- write-off;
- correction.

### BOM

Represents the composition or recipe for producing an item.

### BOMItem

Represents one component line inside a BOM, including quantity and unit assumptions.

### ProductionOrder

Represents a planned or active production execution request.

### ProductionConsumption

Represents actual material consumption linked to production execution.

### FinishedGoodsOutput

Represents actual output of produced goods linked to a production order.

### Shipment

Represents outbound movement to a customer or external destination.

### ShipmentItem

Represents a line inside a shipment document.

### WriteOff

Represents a stock reduction due to spoilage, defect, damage, loss, or approved correction.

### WriteOffItem

Represents a line inside a write-off document.

### InventoryAudit

Represents a counting event that compares expected and actual stock.

### AuditLog

Represents the immutable trace of sensitive or important system actions.

### IndustryProfile

Represents terminology, defaults, enabled features, and profile-specific configuration without altering the core model.

### ModuleConfig

Represents which modules are enabled and what module-level settings apply for an organization.

## Relationship Overview

- `Organization` owns `Users`, `Warehouses`, `Workshops`, `Items`, `IndustryProfile`, and `ModuleConfig`
- `User` has many `Role`
- `Role` has many `Permission`
- `Item` belongs to `ItemCategory` and references `Unit`
- `BOM` belongs to an output `Item`
- `BOM` has many `BOMItem`, each pointing to a component `Item`
- `ProductionOrder` references target `Item`, `Workshop`, and optionally `BOM`
- `ProductionConsumption` belongs to `ProductionOrder` and references consumed `Item`
- `FinishedGoodsOutput` belongs to `ProductionOrder` and references output `Item`
- `StockMovement` references the affected `Item`, source and target context, and initiating document
- `Shipment` has many `ShipmentItem`
- `WriteOff` has many `WriteOffItem`
- `InventoryAudit` references counted storage contexts and resulting corrections
- `AuditLog` references actor, action, module, entity type, and entity id

## Open Modeling Questions for Phase 1

- whether `Workshop` should be modeled as a specialized location or a separate aggregate;
- how far batch traceability should go for MVP;
- whether receipts should be explicit first-class documents or modeled through a generic stock document family;
- which status lifecycles are needed for production, shipment, and inventory audit.
