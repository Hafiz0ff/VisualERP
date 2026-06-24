# CODEX.md

Instructions for Codex/GPT-style coding agents in VisualERP.

## Primary Focus

- implementation quality;
- strict TypeScript;
- modular backend structure;
- test coverage planning;
- API contract discipline;
- keeping code aligned with the documented architecture.

## Expected Working Style

- Start from documentation, then implement the smallest valid change.
- Keep files focused and avoid oversized modules.
- Prefer explicit types, narrow interfaces, and predictable data flow.
- Treat docs as contracts until a later phase formally changes them.

## Coding Rules

- Use strict TypeScript and avoid `any`.
- Design with future tests in mind.
- Keep business logic separated from transport, persistence, and UI concerns.
- Preserve domain names such as `Item`, `Warehouse`, `StockMovement`, and `ProductionOrder`.
- Make industry-specific naming configurable later through `IndustryProfile`.

## Backend and API Guidance

- Do not build the production backend before Phase 4.
- Do not create the final database schema before Phase 2.
- Do not implement APIs before Phase 3 contracts are documented.
- When implementation starts, validate inputs explicitly and keep API contracts stable.

## Process Rules

- Update [TASKS.md](TASKS.md) and [docs/STATUS.md](docs/STATUS.md) after completing a phase.
- Update `README.md` in the same change set after every major spec, phase, or scope update.
- Add tests with code changes in implementation phases.
- Keep the repository modular, documentation-driven, and predictable for future AI agents.
