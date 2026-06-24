# VisualERP Status

## Current Repository State

- **Phase 0 (Project Foundation)**: Completed on 2026-06-25.
- **Phase 1 (Domain Model)**: Completed on 2026-06-25.
- **Phase 2 (Database Schema)**: Completed on 2026-06-25.
- **Phase 3 (API Contract)**: Completed on 2026-06-25. Established REST API specifications (`API-CONTRACT.md`), standardized error code envelopes (`API-ERRORS.md`), role permission scopes (`API-PERMISSIONS.md`), and aligned testing/development guidelines.
- **Backend/API/Frontend**: No business logic controllers, authentication middleware, or frontend widget changes have started. The frontend prototype remains archived in `ERP-прототип.zip`.

## Current Product Direction

- Universal modular mini-ERP for small manufacturing businesses (dry mixes, food, dairy, meat, furniture, tools, textile, packaging).
- Terminology and localization are configuration-driven, separating database fields from industry terminology.
- All quantities and stock balances are derived dynamically from an immutable, transaction-safe ledger of stock movements.

## Immediate Next Step

Next recommended task: **Phase 4 — Backend MVP Foundation**

Phase 4 will cover:
- Initializing the backend HTTP framework (e.g. Express/Next.js).
- Implementing authentication middleware and request session parsing (fetching tenant context).
- Implementing the global Zod validation controller middleware.
- Setting up the error handling middleware transforming exceptions into standard JSON error shapes.
- Creating the core database service layers and applying migrations to verify the seed script against a live database.
