# VisualERP Status

## Current Repository State

- **Phase 0 (Project Foundation)**: Completed on 2026-06-25.
- **Phase 1 (Domain Model)**: Completed on 2026-06-25.
- **Phase 2 (Database Schema)**: Completed on 2026-06-25.
- **Phase 3 (API Contract)**: Completed on 2026-06-25. Established REST API specifications (`API-CONTRACT.md`), standardized error code envelopes (`API-ERRORS.md`), role permission scopes (`API-PERMISSIONS.md`), and aligned testing/development guidelines.
- **Phase 4 (Backend MVP Foundation)**: Completed on 2026-06-25. Implemented Fastify server, database-backed idempotency service, centralized error handler, tenant scoping via request context, audit/permission placeholders, Zod validation hooks, and core CRUD dictionary endpoints for Organizations, Industry Profiles, Units, Item Categories, Items, Locations, Suppliers, and Customers.
- **Phase 5 (Backend Infrastructure & Domain Services)**: Completed on 2026-06-25. Implemented transaction manager, base repository pattern, document lifecycle assertions, concurrency-safe sequential document numbering, dynamic stock ledger calculations, stock availability checks, MANUAL/FIFO/FEFO batch allocation resolver, and transaction-safe domain event bus.
- **Phase 6 (Business Document Workflows)**: Completed on 2026-06-25. Implemented transactional document workflows (create, update, retrieve, list, post, cancel) and stock movement adjustments for Purchase Receipts, location-to-location Transfers, and Write-offs. Enforced non-negative stock level constraints, batch registrations, and idempotency key checks.
- **Backend/API/Frontend**: Backend core dictionaries, infrastructure primitives, and warehouse document workflows (Purchase Receipts, Transfers, Write-offs) are complete and compile cleanly. The frontend prototype remains archived in `ERP-прототип.zip`.

## Current Product Direction

- Universal modular mini-ERP for small manufacturing businesses (dry mixes, food, dairy, meat, furniture, tools, textile, packaging).
- Terminology and localization are configuration-driven, separating database fields from industry terminology.
- All quantities and stock balances are derived dynamically from an immutable, transaction-safe ledger of stock movements.

## Immediate Next Step

Next recommended task: **Phase 7 — Production and Shipment Workflows**

Phase 7 will cover:
- Implementing Bill of Materials (BOM) creation, validation, and active-status restrictions.
- Implementing Production Order lifecycles (DRAFT -> PLANNED -> IN_PROGRESS -> COMPLETED -> CANCELLED).
- Implementing Production Consumption (allocating raw component batches via FIFO/FEFO) and Finished Goods Output.
- Implementing Shipment workflows (SHIPPED) matching customer orders.
- Enforcing ledger-level document immutability and reversing transaction logic.
