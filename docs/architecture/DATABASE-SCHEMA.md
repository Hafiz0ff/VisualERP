# Database Schema Specification

This document details the database schema for VisualERP using PostgreSQL and Prisma ORM. It translates the ubiquitous domain models from [DATA-MODEL.md](DATA-MODEL.md) into concrete tables, relational mappings, data types, constraints, and indices.

---

## 1. Schema Overview

The database is designed with a highly normalized relational structure in PostgreSQL. It is built as a modular monolith, separating core master data, tenant controls, and transaction ledger tables.

Key conventions:
- **UUID keys**: All primary and foreign keys use UUIDs (`@default(uuid())`) for SaaS/multi-tenant readiness and future offline synchronization capability.
- **Timestamps**: All business-critical tables contain `createdAt` and `updatedAt` datetime stamps for historical tracking.
- **Explicit Relations**: Relational constraints are explicitly defined in Prisma, using `onDelete: Cascade` or `onDelete: SetNull` where safe.
- **Scoping**: All tenant-owned tables are linked via `organizationId`.

---

## 2. Main Relational Entity Groups

### 2.1 Organization & Tenant Isolation
- **Organization**: Holds tenant profile, locale configurations, currency symbols, timezones, and the active `IndustryProfile`.
- **User / UserOrganizationMembership / Role / Permission / RolePermission**: Defines a multi-to-multi relation mapping users to organizations with scoped, granular roles and authorization permissions.
- **TerminologyConfig**: Allows a tenant to translate core names (e.g. mapping `BOM` -> "Рецептура" or "Состав изделия") dynamically in the client application.
- **ModuleConfig**: Connects modules (WAREHOUSE, PRODUCTION, BOM, etc.) to a tenant, allowing instant toggling without modifying database rows.
- **IdempotencyKey**: Database table storing request hashes and response cache data linked to `Organization` to support API mutation deduplication.

### 2.2 Items & Units (Master Data)
- **Item**: Core product, material, or component card. Includes `itemType` enum (`MATERIAL`, `COMPONENT`, `PACKAGING`, `SEMI_FINISHED`, `FINISHED_PRODUCT`, `SERVICE`, `CONSUMABLE`).
- **ItemCategory**: Hierarchical tree categorization of items.
- **Unit & UnitConversion**: Standardizes metrics (e.g., kg, pcs, bag). Conversion tables allow decimal conversions (e.g. converting tons to kilograms).

### 2.3 Locations & Stock Batches
- **StockLocation**: A single model for storage (type `WAREHOUSE`) and production (type `WORKSHOP` / `PRODUCTION_AREA`).
- **StockBatch**: Tracks traceable batch identity, received context, optional expiration dates, costs, and quality statuses (`QUARANTINE`, `APPROVED`, `REJECTED`, `EXPIRED`) without becoming the mutable source of truth for stock balances.

### 2.4 Stock Ledger (Movements)
- **StockMovement**: Master transaction log representing inventory mutations (types: `PURCHASE_RECEIPT`, `TRANSFER`, `PRODUCTION_CONSUMPTION`, `PRODUCTION_OUTPUT`, `SHIPMENT`, `WRITE_OFF`, `INVENTORY_ADJUSTMENT`, `RETURN`, `CANCELLATION`).
- **StockMovementLine**: Detail ledger records, tracking positive/negative quantity changes, item, batch, source, and target locations.

### 2.5 Partners & Business Documents
- **Supplier & Customer**: Business directory.
- **PurchaseReceipt**: Logs incoming material shipments, creating or updating batch entries.
- **Transfer**: Logs location changes of specific batches.
- **BOM & BOMLine**: Recipes defining quantity components and expected waste percentages.
- **ProductionOrder / ProductionOrderLine / ProductionConsumption / FinishedGoodsOutput**: Production tracking tables.
- **Shipment / ShipmentLine**: Customer shipments.
- **WriteOff / WriteOffLine**: Logs waste reasons (defect, technological loss, damage, etc.).
- **InventoryAudit / InventoryAuditLine**: Stores physical count sheets, expected quantities, actual quantities, and discrepancy variances.

---

## 3. Core Database Principles

### 3.1 Stock Movement Philosophy
- **Dynamic Derivation**: Real-time stock balances are **never** stored inside the `Item` or `StockLocation` tables. The source of truth for stock quantities is the transaction log of posted `StockMovementLine` lines.
- **No Direct Updates**: Developers must not introduce mutable `currentStock`, mutable per-location batch quantity, or other write-optimized balance fields as the authoritative source. Any future snapshots must be rebuildable from posted movements.
- **Indices**: To accelerate dynamic summation queries, indexes are established on `itemId`, `batchId`, location foreign keys, `status`, and `createdAt` fields.

### 3.2 Document Status Rules
Stock-affecting documents follow a common pattern, but not one universal status enum:
1. **Draft-like states** (`DRAFT`) are editable and do not affect stock.
2. **Effective states** (`POSTED`, `SHIPPED`, `APPROVED`) freeze business intent and create stock movement effects where applicable.
3. **Cancelled states** (`CANCELLED`) freeze the document and require reversing or neutralizing stock effect through movement logic.

Inventory audits use their own lifecycle: `DRAFT -> COUNTED -> APPROVED -> CANCELLED`.

---

## 4. Database Indices & Performance Optimization

To ensure fast query response times under high transaction volumes, indices are defined on:
- All tenant foreign keys (`organizationId` on all tenant-owned models).
- Document identification numbers (e.g. `receiptNumber`, `transferNumber`) combined with `organizationId` for fast lookups.
- Ledger lines query keys: `itemId`, `sourceLocationId`, `targetLocationId`, `batchId`.
- Search fields: `User(email)`, `Item(isActive)`, `ItemCategory(parentId)`.

### 4.1 Invariants Not Fully Enforced by Prisma Alone

Some business rules remain conceptual at schema level and must be enforced in later application services or raw database migrations:
- `Transfer.sourceLocationId` and `Transfer.targetLocationId` must differ.
- Only one active BOM per output item should exist at a time.
- Posted or shipped business documents must be immutable to normal application flows.

---

## 5. Intentionally Deferred Features
The following capabilities are excluded from Phase 2 and will be implemented in subsequent phases:
1. **Foreign Key Database Level Constraints for Terminology Override**: Localizations are dynamically resolved inside services and not hardcoded into PostgreSQL schemas.
2. **Database View for Stock Summary**: A materialized view or PostgreSQL database view representing pre-calculated stock balances is deferred to Phase 6 (Reports).
3. **Database-level Quality Control Triggers**: Automatic expiration status transitions (e.g. marking batches `EXPIRED` automatically when current date exceeds `expirationDate`) are deferred to automated cron job designs in later phases.
