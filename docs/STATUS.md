# VisualERP Status

## Current Repository State

- **Phase 0 (Project Foundation)**: Completed on 2026-06-25.
- **Phase 1 (Domain Model)**: Completed on 2026-06-25.
- **Phase 2 (Database Schema)**: Completed on 2026-06-25.
- **Phase 3 (API Contract)**: Completed on 2026-06-25. Established REST API specifications (`API-CONTRACT.md`), standardized error code envelopes (`API-ERRORS.md`), role permission scopes (`API-PERMISSIONS.md`), and aligned testing/development guidelines.
- **Phase 4 (Backend MVP Foundation)**: Completed on 2026-06-25. Implemented Fastify server, database-backed idempotency service, centralized error handler, tenant scoping via request context, audit/permission placeholders, Zod validation hooks, and core CRUD dictionary endpoints for Organizations, Industry Profiles, Units, Item Categories, Items, Locations, Suppliers, and Customers.
- **Backend/API/Frontend**: Backend core foundation and CRUD dictionary endpoints are complete and compile cleanly. The frontend prototype remains archived in `ERP-прототип.zip`.

## Current Product Direction

- Universal modular mini-ERP for small manufacturing businesses (dry mixes, food, dairy, meat, furniture, tools, textile, packaging).
- Terminology and localization are configuration-driven, separating database fields from industry terminology.
- All quantities and stock balances are derived dynamically from an immutable, transaction-safe ledger of stock movements.

## Immediate Next Step

Next recommended task: **Phase 5 — Transactional Logic & Ledgers**

Phase 5 will cover:
- Implementing core business transactions: Purchase Receipts, location-to-location Transfers, Production Orders with Material Consumption and Finished Goods Output, and Shipments.
- Implementing write-off transactions and physical inventory count audits.
- Enforcing non-negative stock balance invariants at transaction boundaries.
- Calculating dynamic per-location stock balances and batch lifecycle tracking.
- Implementing ledger-level immutability blocks for posted transactions.
