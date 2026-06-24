# Development Rules

These rules govern future implementation phases.

## TypeScript

- TypeScript strict mode is required.
- `any` is not allowed except in documented, temporary migration boundaries.
- Prefer explicit domain types over loosely shaped objects.

## File and Module Design

- Keep files small and focused.
- Prefer domain-first structure over technical dumping grounds.
- Separate business logic from transport, persistence, and UI layers.
- Avoid large all-purpose service classes.

## Business Logic

- Do not hardcode business constants that belong in configuration.
- Do not hardcode construction-material terms into the core model.
- Keep module boundaries clear and explicit.
- Favor deterministic behavior over hidden side effects.

## Validation

- Use explicit validation at boundaries.
- Zod is the planned validation approach for future phases.
- Validate input data before it reaches domain logic.

## Testing

- Test business logic directly.
- Permission-sensitive behavior must have dedicated tests.
- Cross-module flows must have integration coverage.

## Documentation

- Update relevant docs when code changes affect behavior, naming, or architecture.
- Treat docs as part of the product, not optional afterthoughts.
