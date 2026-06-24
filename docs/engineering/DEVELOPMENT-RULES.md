# Development Rules

These rules govern the development, database design, and backend implementation of VisualERP. All contributors (including AI agents) must follow these guidelines strictly.

---

## 1. Programming Language & Naming Conventions

### 1.1 TypeScript
- **TypeScript strict mode is required**. No compilation errors or warnings are permitted.
- **Strict Typing**: The `any` type is forbidden. Use specific interfaces, types, or generics.
- **Explicit Domain Types**: Always use domain types rather than loosely shaped objects. For example, pass a fully typed `Item` or `StockMovementLine` object rather than a generic record.

### 1.2 Ubiquitous Language Naming
- Use only the universal ERP names in database schemas, backend code, and APIs:
  - Use `Item` (never `raw_material`, `product`, or `recipe_ingredient` directly).
  - Use `BOM` and `BOMLine` (never `recipe`, `specification`, or `mix_formula`).
  - Preserve explicit domain concepts `Warehouse` and `Workshop`; if persistence later uses a shared `StockLocation` table or abstraction, treat that as an implementation detail rather than a replacement for domain language.
  - Use `StockBatch` (never `lot`, `series`, or `trace_number`).
- Industry-specific nomenclature must be loaded from `TerminologyConfig` dynamically in the UI layer.

---

## 2. File and Module Design

- **Small and Focused Files**: Each file should have a single responsibility.
- **Domain-First Structure**: Group code by domain features (e.g., `modules/warehouse`, `modules/production`, `modules/bom`) rather than technical layers (e.g., placing all services in a single massive `services/` directory).
- **Separation of Layers**: Keep database access (persistence), HTTP routing (transport), and business logic (domain) isolated. Domain services should not know about HTTP requests or Express/Next.js request objects.

---

## 3. Database & Transaction Rules

### 3.1 Atomic Transactions
- **Rule**: Every stock-affecting operation must be executed inside an atomic database transaction.
- **Detail**: When a user posts a document (e.g., a `PurchaseReceipt`), the state transition, the creation of the `StockMovement` header, and all the `StockMovementLine` rows must succeed or fail together. If any row fails validation, the database transaction must be completely rolled back.
  ```typescript
  // Example of transaction scoping in Prisma
  await prisma.$transaction(async (tx) => {
    await tx.purchaseReceipt.update({ ... });
    await tx.stockMovement.create({ ... });
    await tx.stockMovementLine.createMany({ ... });
  });
  ```

### 3.2 No Physical Delete for Posted Records
- Do not write database operations that use `DELETE` on posted transactions.
- All corrections must happen via:
  - Status updates (`status = 'cancelled'`).
  - Creating compensating transaction lines in `StockMovementLine` (offsetting positive/negative quantities).
- Do not introduce mutable "current stock balance" or mutable "current batch quantity by location" tables as the primary source of truth. If snapshots or read models are added later, they must be rebuildable from posted movements.

---

## 4. API Implementation Rules

- **Explicit Lifecycle Routing**: Document transitions (like posting or cancellation) must never be performed via general PATCH updates. Use explicit POST action routes (e.g., `/api/purchase-receipts/:id/post` or `/api/purchase-receipts/:id/cancel`).
- **Posted Immutability**: The API controllers and service layers must block any updates (PUT/PATCH/DELETE) targeting a document with a status of `POSTED` or `CANCELLED`.
- **Shipment Lifecycle Naming**: Shipment execution uses `SHIPPED` status and `/ship` action endpoints. Do not model shipments as generic `/post` actions in API code.
- **Zod Validation**: All API request payloads must be strictly validated at the controller boundary using Zod schemas before being passed to domain logic.
- **Granular Permission Guards**: Every endpoint must be guarded by an authorization middleware that checks if the active user's role contains the required granular permission string (`module:action`) specified in the permissions matrix.
- **Multi-Tenant Context Scoping**: The API must verify the tenant context (`X-Organization-Id` or session-bound organization) for every request. Any query referencing items, locations, or documents must ensure they match the active organization. Scoping violations must return `403 Forbidden` (code `ORGANIZATION_SCOPE_VIOLATION`).

---

## 5. Input Validation & Domain Invariants

- **Boundary Validation**: Validate all inputs at the API controller boundaries before they reach domain services. Use Zod schemas matching the database structures.
- **Non-Negative Invariant**: The calculated stock balance for any `Item` inside a `StockLocation` for a specific `StockBatch` should not fall below zero. Validate stock availability before posting any stock-reduction documents.
- **Unit Matching**: Ensure that transaction units match the base unit of the item, or verify that a valid `UnitConversion` mapping exists.
- **Tenant-Membership Invariant**: `organizationId` selection from headers or route params must be validated against `UserOrganizationMembership` before processing any action.

---

## 6. Security & Auditing

- **Scoping to Tenant**: Every database query that interacts with business data must explicitly filter by `organizationId`. Failing to include `organizationId` is a critical security vulnerability.
- **Audit Logging**: Any write operation that updates user permissions, alters system configurations, or transitions documents to `Posted` or `Cancelled` states must write an entry to `AuditLog` within the same database transaction.

---

## 7. Testing Strategy

- **Domain-Logic Isolation**: Write unit tests for domain services (e.g., calculating unit conversions, evaluating BOM waste factors) without mocking the database if possible, or using in-memory databases.
- **Transaction Verification**: Write integration tests that verify rollbacks occur when bad data is supplied in stock-affecting flows.
- **Permission Tests**: Any route or service that checks roles must have dedicated test coverage showing correct authorization and 403 blocks.
