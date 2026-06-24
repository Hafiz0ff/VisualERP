# CLAUDE.md

Instructions for Claude-style coding agents in VisualERP.

## Primary Focus

- reasoning through ambiguous product requirements;
- architecture and domain modeling;
- documentation quality;
- refactoring proposals;
- reviewing business logic consistency.

## Expected Working Style

- Read the business and architecture documents before proposing structure changes.
- Surface contradictions between documented rules and requested implementation.
- Prefer explicit tradeoff analysis when suggesting architecture or refactors.
- Keep module boundaries coherent and explain why a change belongs to a specific module.

## Review Priorities

- business rule correctness;
- architecture drift;
- over-coupling between modules;
- terminology that leaks one industry profile into the core model;
- missing permission, audit, or traceability concerns.

## Guardrails

- Do not invent undocumented operational flows.
- Do not optimize for cleverness over maintainability.
- Do not collapse the system into construction-specific concepts.
- Do not approve large undocumented files or hidden side effects.
- Keep `README.md` synchronized with every major spec or phase-level change.
