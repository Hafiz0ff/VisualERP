# VisualERP Status

## Current Repository State

- **Phase 0 (Project Foundation)**: Completed on 2026-06-25.
- **Phase 1 (Domain Model)**: Completed on 2026-06-25. Detailed specifications have been established for all core entities, relationships, validation invariants, API endpoints, module configuration rules, and security guidelines.
- **Backend/Database**: No schema files (Prisma) or backend implementations have been created yet.
- **Frontend**: The original frontend prototype remains archived in `ERP-прототип.zip`.

## Current Product Direction

- Universal modular mini-ERP for small manufacturing businesses (dry mixes, food, dairy, meat, furniture, tools, textile, packaging).
- Terminology and localization are configuration-driven, separating database fields from industry terminology.
- All quantities and stock balances are derived dynamically from an immutable, transaction-safe ledger of stock movements.

## Immediate Next Step

Next recommended task: **Phase 2 — Database Schema**

Phase 2 will cover:
- Defining the database schema (Prisma/SQL DDL).
- Setting up Zod validations matching the domain model.
- Implementing database seed files and automated migration setups.
