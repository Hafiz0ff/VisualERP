# Backend Infrastructure Design

This document details the backend architectural foundations for VisualERP, implemented in **Phase 5**. These primitives ensure database consistency, multi-tenant isolation, structured document numbering, and clean separation of concerns.

---

## 1. Transaction Management

All operations affecting stock or transitioning document states must run inside atomic database transactions using `runInTransaction`. This prevents partial writes and guarantees database consistency.

- **Implementation**: `src/shared/db/transaction.ts`
- **Mechanism**: Wraps Prisma's `$transaction` callback with type-safe context propagation.
- **Rules**:
  - No business transactions should bypass this wrapper.
  - Audit logging and domain event dispatching must run inside the same transaction block when changes occur.

---

## 2. Scoped Repository Layer

The repository layer isolates database access and enforces tenant partitioning.

- **Implementation**: `src/shared/repositories/base-repository.ts`
- **Pattern**: `BaseRepository` serves as the abstract parent class. Subclasses inherit a database client (which can be a standard Prisma client or transaction client) and helper methods to inject `organizationId`.
- **Tenant Scope Enforcement**: Every select, update, or count query must filter by `organizationId`. Scoping failures must trigger immediate blocks.

---

## 3. Document Lifecycle Foundation

Business documents follow strict lifecycle states: `DRAFT`, `POSTED` (or finished product equivalent), and `CANCELLED`.

- **Implementation**: `src/modules/documents/document-lifecycle.service.ts`
- **Key Assertions**:
  - `assertCanPost`: Blocks posting of already posted or cancelled records.
  - `assertCanCancel`: Prevents double cancellations.
  - `assertCanUpdateDraft`: Prevents modifying posted or cancelled documents.
  - `assertPostedDocumentImmutable`: Blocks standard updates (PUT/PATCH/DELETE) targeting finalized states.

---

## 4. Sequential Document Numbering

Unique, sequential, human-readable numbers are required for every business document (e.g. `REC-000001`, `TRF-000001`).

- **Implementation**: `src/modules/documents/document-number.service.ts`
- **Database Model**: `DocumentSequence` tracks the last issued counter per prefix per organization.
- **Concurrency Safety**: Utilizes Prisma's atomic `upsert` and should be called inside `runInTransaction` for business documents. If called outside a transaction during high-concurrency initial sequence creation, database uniqueness still prevents duplicate sequence rows, but callers should treat transactional usage as the production rule.

---

## 5. Domain Event Dispatcher

Allows loose coupling between modules using synchronous, transaction-safe events.

- **Implementation**: `src/shared/domain/event-bus.ts` and `domain-event.ts`
- **Mechanism**: Events are dispatched in-process. Subscribers run sequentially inside the active transaction block.
- **Failures**: If a subscriber throws, the event handler immediately propagates the failure, rolling back the transaction.
- **Future Scale**: This in-memory bus can be replaced with a durable outbox pattern for high scalability.
