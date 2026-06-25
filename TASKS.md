# VisualERP Tasks

Phase-based delivery checklist for the project roadmap.

## Current Status

- [x] Phase 0 - Project Foundation
- [x] Phase 1 - Domain Model
- [x] Phase 2 - Database Schema
- [x] Phase 3 - API Contract
- [x] Phase 4 - Backend MVP Foundation
- [x] Phase 5 - Backend Infrastructure & Domain Services
- [x] Phase 6 - Business Document Workflows
- [x] Phase 7 - Production and Shipment Workflows
- [ ] Phase 8 - Inventory Audits and Stock Reports
- [ ] Phase 9 - Frontend Integration
- [ ] Phase 10 - Reports and Dashboard
- [ ] Phase 11 - Testing and Hardening
- [ ] Phase 12 - Deployment
- [ ] Phase 13 - Industry Profiles

## Phase Notes

### Phase 0 - Project Foundation

Status: completed on 2026-06-25.

Scope:
- repository structure;
- product and business context;
- architecture direction;
- engineering rules;
- AI-agent instructions;
- roadmap and ADR baseline.

Exit criteria:
- all required documentation files exist;
- docs describe a universal mini-ERP, not a single-industry tool;
- no backend or schema implementation was added.

---

### Phase 1 - Domain Model

Status: completed on 2026-06-25.

Scope:
- Finalized ubiquitous language and universal domain entities.
- Refined conceptual entity relationships, properties, and enums.
- Specified document lifecycle states, shipment-specific `SHIPPED` status, and dynamic balance derivation rules from stock movements.
- Updated API drafts, security guidelines, and developer guidelines.

Exit criteria:
- No backend code, migrations, or database schemas created.
- Detailed domain model documented in `docs/architecture/DATA-MODEL.md`.
- All operational modules, business processes, security matrices, and API specifications updated.

---

### Phase 2 - Database Schema

Status: completed on 2026-06-25.

Scope:
- Designed modular relational database schema in `prisma/schema.prisma` mapping all 30+ domain models.
- Set up UUID keys, explicit relations, timestamps, enums, indices, and organization tenant isolation.
- Created minimal idempotent demo seed data in `prisma/seed.ts` for the `dry_mixes` profile without hardcoding the core schema to one industry.
- Initialized typescript tooling (`tsconfig.json`, `package.json`) and exports (`src/db/prisma.ts`).
- Created `docs/architecture/DATABASE-SCHEMA.md` explaining database mappings and stock ledger rules.

Exit criteria:
- Prisma schema file compiles and validates successfully.
- Seed data contains correct items, units, locations, and formula BOM.
- No REST controller endpoints or UI widgets implemented.

---

### Phase 3 - API Contract

Status: completed on 2026-06-25.

Scope:
- Designed standard success, paginated list, and error JSON envelopes.
- Created `docs/architecture/API-CONTRACT.md` detailing HTTP verbs, query filters, idempotency keys, and conceptual DTO fields for all 23 groups.
- Standardized 16 error codes, HTTP statuses, and example bodies in `docs/architecture/API-ERRORS.md`.
- Mapped module permissions and role matrices in `docs/architecture/API-PERMISSIONS.md`.
- Aligned developer guidelines and testing strategies with API rules.

Exit criteria:
- No routing logic or TypeScript controller classes implemented.
- No database migrations or schema adjustments introduced.

---

### Phase 4 - Backend MVP Foundation

Status: completed on 2026-06-25.

Scope:
- Set up Fastify framework, UUID-based request tracking, and TypeScript runtime.
- Added database-backed idempotency service utilizing `IdempotencyKey` model.
- Developed centralized error handler routing application errors/Zod validation failures into standard API envelopes.
- Configured multi-tenant organization context scoping via global hooks and the `X-Organization-Id` header.
- Implemented core CRUD dictionary endpoints for the 8 primary entities: Organizations, Industry Profiles, Units, Item Categories, Items, Locations, Suppliers, and Customers.

---

### Phase 5 - Backend Infrastructure & Domain Services

Status: completed on 2026-06-25.

Scope:
- Implemented transaction manager, base repository abstractions, and generic domain validation helpers.
- Built reusable document lifecycle assertion services and prefix-based, concurrency-safe document number generation.
- Developed dynamic stock ledger calculations, stock availability validation checks, and MANUAL/FIFO/FEFO batch allocation resolvers.
- Created transaction-safe, synchronous, in-process domain event bus.

---

### Phase 6 - Business Document Workflows

Status: completed on 2026-06-25.

Scope:
- Implemented core REST API endpoints (GET, POST, GET /:id, PATCH, POST /:id/post, POST /:id/cancel) for Purchase Receipts, Transfers, and Write-offs.
- Enforced document state transition guards (DRAFT -> POSTED -> CANCELLED) via lifecycle service checks.
- Bound mutations to atomic database transactions containing stock ledger movements, batch resolutions, and audit log entries.
- Applied idempotency check hooks preventing duplicate request executions.

---

### Phase 7 - Production and Shipment Workflows

Status: completed on 2026-06-25.

Scope:
- Implemented production order status transitions (PLANNED -> IN_PROGRESS -> COMPLETED -> CANCELLED) and sequential number generation prefix `PRD`.
- Implemented Bill of Materials (BOM) validation and fallback component consumption formulas (with `wastePercent` scaling).
- Implemented production completion with input material deductions (via FEFO/FIFO batch resolvers) and finished goods output additions.
- Implemented shipments matching sales orders (DRAFT -> SHIPPED -> CANCELLED) with sequential prefix `SHP`.
- Enforced compensating cancellation stock checks on production cancellation.
- Enforced tenant organization scoping and request idempotency key checks.

---

### Phase 8 - Inventory Audits and Stock Reports

Status: next recommended task.

Planned outcomes:
- Implement physical Inventory Audits (DRAFT -> COUNTED -> APPROVED -> CANCELLED).
- Implement discrepancy-based stock ledger adjustments.
- Implement stock balance reports and batch status reports.
- Enforce permission scopes and idempotency checks.

---

### Later Phases

Each later phase should begin only after the prior phase is documented, reviewed, and reflected in [docs/STATUS.md](docs/STATUS.md).
