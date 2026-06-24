# ADR-001: Use Modular Monolith

## Status

Accepted

## Context

VisualERP is an early-stage product for small manufacturing businesses. The domain is still being shaped, the team is expected to be small, and the first goal is to reach a usable MVP without unnecessary operational complexity.

The system must support multiple future industry profiles, but the current implementation scope is still modest enough to live in one deployable application.

## Decision

Use a **modular monolith** instead of microservices.

## Reasons

- faster development;
- easier deployment;
- better fit for a small team;
- easier local development and testing;
- easier for AI coding agents to reason about;
- sufficient for MVP and first clients.

## Consequences

Positive:

- clearer single-repository flow;
- lower infrastructure overhead;
- simpler transactional consistency in early versions;
- easier cross-module refactoring while the domain is still moving.

Tradeoffs:

- discipline is required to keep module boundaries clean;
- poor internal structure could become a hidden monolith if left unchecked;
- future extraction of services would require explicit interface boundaries.

## Follow-Up

Future phases should reinforce this decision by:

- keeping modules explicit;
- avoiding cross-module shortcuts;
- preserving stable contracts inside the monolith.
