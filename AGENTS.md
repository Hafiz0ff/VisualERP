# AGENTS.md

General operating rules for any AI coding agent working in this repository.

## Before Any Change

- Read [README.md](README.md), [docs/PROJECT-CONTEXT.md](docs/PROJECT-CONTEXT.md), and the relevant docs for the area you are touching.
- Confirm whether the requested work belongs to the current phase.
- Check [TASKS.md](TASKS.md) and [docs/STATUS.md](docs/STATUS.md) before starting.

## Product and Domain Rules

- Do not invent business rules.
- Do not hardcode industry-specific logic into the core domain.
- Use universal ERP entities such as `Item`, `Warehouse`, `Workshop`, `StockMovement`, `BOM`, and `ProductionOrder`.
- Treat industry-specific terminology as profile configuration, not as core data model names.

## Architecture Rules

- Keep a modular architecture.
- Prefer clear module boundaries over convenience-driven coupling.
- Avoid hidden side effects between modules.
- Preserve the direction: `VisualERP Core + Industry Profiles + Optional Modules`.

## Code Quality Rules

- Write clean TypeScript.
- Use strict typing and avoid `any`.
- Keep files small and focused.
- Prefer explicit contracts, validation, and predictable behavior.
- Do not create large god-objects, god-services, or god-routes.

## Process Rules

- Update [TASKS.md](TASKS.md) and [docs/STATUS.md](docs/STATUS.md) after each completed phase or meaningful milestone.
- Update `README.md` after every major spec, major phase, or meaningful scope change so the GitHub landing page stays current.
- Add or update documentation when business rules, architecture, or interfaces change.
- Do not implement backend, database schema, or frontend redesign work outside the approved phase.
- Keep the existing frontend prototype archive in place unless the user explicitly requests otherwise.
