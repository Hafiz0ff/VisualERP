# VisualERP Status

## Current Repository State

- **Phase 0 (Project Foundation)**: Completed on 2026-06-25.
- **Phase 1 (Domain Model)**: Completed on 2026-06-25.
- **Phase 2 (Database Schema)**: Completed on 2026-06-25.
- **Phase 3 (API Contract)**: Completed on 2026-06-25. Established REST API specifications (`API-CONTRACT.md`), standardized error code envelopes (`API-ERRORS.md`), role permission scopes (`API-PERMISSIONS.md`), and aligned testing/development guidelines.
- **Phase 4 (Backend MVP Foundation)**: Completed on 2026-06-25. Implemented Fastify server, database-backed idempotency service, centralized error handler, tenant scoping via request context, audit/permission placeholders, Zod validation hooks, and core CRUD dictionary endpoints for Organizations, Industry Profiles, Units, Item Categories, Items, Locations, Suppliers, and Customers.
- **Phase 5 (Backend Infrastructure & Domain Services)**: Completed on 2026-06-25. Implemented transaction manager, base repository pattern, document lifecycle assertions, concurrency-safe sequential document numbering, dynamic stock ledger calculations, stock availability checks, MANUAL/FIFO/FEFO batch allocation resolver, and transaction-safe domain event bus.
- **Phase 6 (Business Document Workflows)**: Completed on 2026-06-25. Implemented transactional document workflows (create, update, retrieve, list, post, cancel) and stock movement adjustments for Purchase Receipts, location-to-location Transfers, and Write-offs. Enforced non-negative stock level constraints, batch registrations, and idempotency key checks.
- **Phase 7 (Production and Shipment Workflows)**: Completed on 2026-06-25. Implemented transactional document workflows for Production Orders and Shipments. Linked Bills of Materials (BOM) and material consumption (FIFO/FEFO batch allocations) to the stock ledger, implemented finished goods output, customer shipments, and reversing cancellation logic.
- **Phase 8 (Inventory Audits and Stock Reports)**: Completed on 2026-06-25. Implemented physical inventory audits with status transitions (DRAFT -> COUNTED -> APPROVED -> CANCELLED) and discrepancy-based stock ledger adjustments using `INVENTORY_ADJUSTMENT` movement types. Exposed read-only stock reports (matrix, per-item, per-location, historical movement logs, active batch list, and a safe low-stock limitation response until minimum stock thresholds are modeled).
- **Phase 9 (Dashboard and MVP Demo Flow)**: Completed on 2026-06-25. Implemented real-time dashboard endpoint (`GET /api/dashboard`) returning stock summaries (dynamically calculated from movements), production/shipment/write-off monthly counts, pending document actions, and recent audit events. Created a comprehensive end-to-end MVP Demo Flow guide using `curl`.
- **Phase 10 (Frontend Integration Planning)**: Completed on 2026-06-25. Prepared a detailed frontend integration plan mapping all 16 prototype screens to backend APIs, DTO contracts, required permissions, state/error lifecycle rules, and integration risks/mitigations. No code or archive changes were introduced.
- **Phase 11 (Frontend API Client and Read-Only Integration)**: Completed on 2026-06-25. Implemented shared fetch-based API client, envelop parser, toast error handling, active organization dropdown switcher, mapper conversions, and connected all list/detail views (Dashboard, Raw Materials, Products, Receipts, Transfers, Production, Shipments, Write-offs, Workshop, Reports, AuditLog) as read-only.
- **Backend/API/Frontend**: Backend services, schema, dictionary CRUDs, warehouse documents, report queries, real-time dashboard endpoints, and frontend client integration are complete and compile cleanly.

## Current Product Direction

- Universal modular mini-ERP for small manufacturing businesses (dry mixes, food, dairy, meat, furniture, tools, textile, packaging).
- Terminology and localization are configuration-driven, separating database fields from industry terminology.
- All quantities and stock balances are derived dynamically from an immutable, transaction-safe ledger of stock movements.

## Immediate Next Step

Next recommended task: **Phase 12 — Frontend Mutations and Lifecycle Actions**

Phase 12 will cover:
- Connecting creation/modification forms in the frontend to backend POST/PATCH API endpoints.
- Integrating document lifecycle actions (post, cancel, ship, count, approve) with required Idempotency-Key headers.
