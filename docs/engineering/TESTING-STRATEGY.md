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
- production-to-stock effects;
- **Dynamic Ledger Tests**: Verify that balances computed via `StockLedgerService` are correct after posting multiple incoming/outgoing movements, including correct location-specific calculations;
- **Transactional Rollback Tests**: Assert that when a document fails to save, all created lines, sequence increments, and audit log writes are completely rolled back;
- **Event Dispatch Tests**: Verify that Event Bus subscribers execute synchronously and that subscriber errors poison and abort the active Prisma transaction;
- **Number Generation Concurrency Tests**: Simulate concurrent generation requests to verify that no duplicate document sequence numbers are generated.

### API Tests

API testing must verify route behavior, input sanitization, and security guard stability:
- **Contract Verification Tests**: Ensure success and paginated list response payloads conform to the standard envelopes (`data`, `pagination`, `meta`), and that fields match the conceptual DTO specifications.
- **Request Validation Tests**: Verify that Zod schemas block invalid payloads (e.g. negative quantities, missing required fields) and return `VALIDATION_ERROR` (HTTP 400) with a list of invalid fields in the details array.
- **Authorization & RBAC Tests**: Verify that request calls from users lacking the required granular permission string (e.g. `purchase_receipts:post`) are blocked with a `FORBIDDEN` (HTTP 403) status.
- **Multi-Tenancy Isolation Tests**: Ensure that route requests scope queries to the authenticated user's organization. Simulate cross-tenant reference attacks (e.g., trying to read an item ID belonging to tenant B while logged into tenant A) to verify that the API returns `ORGANIZATION_SCOPE_VIOLATION` (HTTP 403).
- **Idempotency Key Tests**:
  - Test sending identical `Idempotency-Key` headers for duplicate requests. Verify that the second request returns the cached response without running domain logic twice.
  - Test sending the same key with different payloads. Verify that the server returns `IDEMPOTENCY_CONFLICT` (HTTP 409).
- **Lifecycle Action Tests**: Verify that critical document status changes are rejected through generic `PATCH` payloads and accepted only through explicit action endpoints such as `/post`, `/ship`, `/complete`, `/approve`, and `/cancel`.


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
