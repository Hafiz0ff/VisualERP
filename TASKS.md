# VisualERP Tasks

Phase-based delivery checklist for the project roadmap.

## Current Status

- [x] Phase 0 - Project Foundation
- [x] Phase 1 - Domain Model
- [x] Phase 2 - Database Schema
- [x] Phase 3 - API Contract
- [x] Phase 4 - Backend MVP Foundation
- [ ] Phase 5 - Transactional Logic & Ledgers
- [ ] Phase 6 - Frontend Integration
- [ ] Phase 7 - Reports and Dashboard
- [ ] Phase 8 - Testing and Hardening
- [ ] Phase 9 - Deployment
- [ ] Phase 10 - Industry Profiles

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

### Phase 5 - Transactional Logic & Ledgers

Status: next recommended task.

Planned outcomes:
- Implement transactional document routes and services: Purchase Receipts, location-to-location Transfers, Production Orders (with Material Consumption and Finished Goods Output), and Shipments.
- Implement write-off transactions and physical inventory count audits.
- Enforce non-negative stock balance invariants at transaction boundaries.
- Calculate dynamic per-location stock balances and batch lifecycle tracking.
- Implement ledger-level immutability blocks for posted transactions.

---

### Later Phases

Each later phase should begin only after the prior phase is documented, reviewed, and reflected in [docs/STATUS.md](docs/STATUS.md).
