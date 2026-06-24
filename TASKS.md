# VisualERP Tasks

Phase-based delivery checklist for the project roadmap.

## Current Status

- [x] Phase 0 - Project Foundation
- [x] Phase 1 - Domain Model
- [ ] Phase 2 - Database Schema
- [ ] Phase 3 - API Contract
- [ ] Phase 4 - Backend MVP
- [ ] Phase 5 - Frontend Integration
- [ ] Phase 6 - Reports and Dashboard
- [ ] Phase 7 - Testing and Hardening
- [ ] Phase 8 - Deployment
- [ ] Phase 9 - Industry Profiles

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
- Specified document lifecycle rules, domain-specific statuses, and dynamic balance derivation rules from stock movements.
- Updated API drafts, security guidelines, and developer guidelines.

Exit criteria:
- No backend code, migrations, or database schemas created.
- Detailed domain model documented in `docs/architecture/DATA-MODEL.md`.
- All operational modules, business processes, security matrices, and API specifications updated.

---

### Phase 2 - Database Schema

Status: next recommended task.

Planned outcomes:
- Design database schema matching the Phase 1 domain model (Prisma schema or SQL DDL).
- Define input validation structures using Zod.
- Create seed scripts for roles, standard permissions, and the default industry profile templates (`dry_mixes`, `food`, etc.).
- Prepare automated database migration instructions and verify schema validation.

---

### Later Phases

Each later phase should begin only after the prior phase is documented, reviewed, and reflected in [docs/STATUS.md](docs/STATUS.md).
