# Testing Strategy

Testing will be introduced with implementation phases, but the quality bar is defined now.

## Test Layers

### Unit Tests

Use unit tests for:

- domain rules;
- pure calculations;
- status transitions;
- permission helpers;
- validation logic.

### Integration Tests

Use integration tests for:

- module interactions;
- repository and persistence behavior;
- stock movement flows;
- production-to-stock effects.

### API Tests

Use API tests for:

- request validation;
- response contract stability;
- authorization behavior;
- error shape consistency.

### Business Flow Tests

Use end-to-end or workflow tests for the core operational cycle:

- purchase receipt;
- warehouse transfer;
- production order;
- consumption;
- finished goods output;
- shipment;
- write-off;
- reporting visibility.

### Permission Tests

Every critical role should have tests that prove allowed and forbidden actions.

### Audit Log Tests

Audit behavior should be verified for sensitive operations, including:

- actor attribution;
- entity reference;
- action type;
- timestamp presence.

## Quality Principles

- Prefer meaningful tests over shallow coverage metrics.
- Write tests close to domain behavior.
- Avoid coupling tests to implementation details where possible.
- Preserve a fast feedback loop for core business logic.
