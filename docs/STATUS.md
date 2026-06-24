# VisualERP Status

## Current Repository State

- **Phase 0 (Project Foundation)**: Completed on 2026-06-25.
- **Phase 1 (Domain Model)**: Completed on 2026-06-25.
- **Phase 2 (Database Schema)**: Completed on 2026-06-25.
- **Phase 3 (API Contract)**: Completed on 2026-06-25. Established REST API specifications (`API-CONTRACT.md`), standardized error code envelopes (`API-ERRORS.md`), role permission scopes (`API-PERMISSIONS.md`), and aligned testing/development guidelines.
- **Phase 4 (Backend MVP Foundation)**: Completed on 2026-06-25. Implemented Fastify server, database-backed idempotency service, centralized error handler, tenant scoping via request context, audit/permission placeholders, Zod validation hooks, and core CRUD dictionary endpoints for Organizations, Industry Profiles, Units, Item Categories, Items, Locations, Suppliers, and Customers.
- **Phase 5 (Backend Infrastructure & Domain Services)**: Completed on 2026-06-25. Implemented transaction manager, base repository pattern, document lifecycle assertions, concurrency-safe sequential document numbering, dynamic stock ledger calculations, stock availability checks, MANUAL/FIFO/FEFO batch allocation resolver, and transaction-safe domain event bus.
- **Backend/API/Frontend**: Backend core foundation, dictionary endpoints, and reusable domain infrastructure services are complete and compile cleanly. The frontend prototype remains archived in `ERP-прототип.zip`.

## Current Product Direction

- Universal modular mini-ERP for small manufacturing businesses (dry mixes, food, dairy, meat, furniture, tools, textile, packaging).
- Terminology and localization are configuration-driven, separating database fields from industry terminology.
- All quantities and stock balances are derived dynamically from an immutable, transaction-safe ledger of stock movements.

## Immediate Next Step

Next recommended task: **Phase 6 — Business Document Workflows**

Phase 6 will cover:
- Implementing complete transaction post/cancel workflows for Purchase Receipts (updating batch parameters, recording ledger entry).
- Implementing location-to-location Transfers (verifying stock availability before write-down, writing ledger entry).
- Implementing Production Order lifecycles (consuming component batches using FIFO/FEFO strategies, writing yield output ledger lines).
- Implementing Shipments, Write-offs, and physical Inventory Audits.
- Enforcing ledger-level document immutability and reversing transaction logic.
