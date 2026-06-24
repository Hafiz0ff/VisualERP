# Security Baseline

This document specifies the security requirements, authorization guidelines, data isolation patterns, and auditing standards for VisualERP.

---

## 1. Multi-Tenant Data Isolation

VisualERP is designed to be multi-tenant ready from the start. Data isolation must be enforced at the database and application levels to ensure that one organization can never access another organization's records.

### 1.1 Tenant Isolation Strategy
- **Single Database with Shared Schema**: Organizations share a database. Every table containing organization-specific data (e.g., Items, Warehouses, Receipts, Stock Movements) must have an `organizationId` column.
- **Tenant Context Bindings**: Every API request must run within a context bound to a validated `organizationId` fetched from the user's authenticated session.
- **Never Trust Raw Tenant Selectors**: A client-supplied `X-Organization-Id` header or query parameter must never grant access by itself. It may only select among organizations already authorized through `UserOrganizationMembership`.
- **Database Query Filtering**:
  - All database queries (Prisma/SQL queries) must explicitly contain the `organizationId` in their `where` clause:
    ```typescript
    prisma.item.findMany({
      where: {
        organizationId: ctx.organizationId,
        isActive: true
      }
    })
    ```
  - Code reviews must verify that no query bypasses the `organizationId` filter, except for system-wide read-only tables (like `IndustryProfile` or global permissions).

---

## 2. Authentication

Authentication verifies the identity of users logging into VisualERP.
- **Session Tokens**: JWT (JSON Web Tokens) or secure HTTP-only cookies are used to track session state.
- **Password Hashing**: Passwords must be hashed using a strong hashing algorithm (e.g., bcrypt or Argon2id) before database storage.
- **Future SaaS Integration**: The authentication layer should remain modular, allowing future transition to external identity providers (e.g., Auth0, Firebase Auth, Google Workspace, Keycloak).

---

## 3. Role-Based Access Control (RBAC)

Authorization is role-based, where permissions are granular strings checked at the API route and business logic levels.

### 3.1 Role Hierarchy
The system supports predefined system roles that cannot be deleted, plus optional customizable roles:

| Role Name | System Role? | Purpose |
| :--- | :---: | :--- |
| **Owner** | Yes | Full access, settings modification, module configuration, billing. |
| **Warehouse Manager** | Yes | Manage inventory, post receipts, execute transfers, perform audits. |
| **Production Supervisor**| Yes | Manage BOMs, plan/start production orders, confirm outputs. |
| **Operator** | Yes | Record production consumptions, read items and stock balances. |
| **Auditor** | Yes | Read-only access to all transactional records and reports; manages Audit Logs. |

### 3.2 Granular Permissions Matrix
Permissions follow the format `module:resource:action`. Below are examples of permissions grouped by module:

```txt
Master Data (Core):
  - core:items:create
  - core:items:update
  - core:items:read
  - core:units:manage

Warehouse Module:
  - warehouse:receipts:create
  - warehouse:receipts:post
  - warehouse:receipts:cancel
  - warehouse:transfers:create
  - warehouse:transfers:post
  - warehouse:transfers:cancel
  - warehouse:audits:manage

Production Module:
  - production:orders:create
  - production:orders:start
  - production:orders:consume
  - production:orders:output
  - production:orders:complete
  - production:orders:cancel

BOM / Recipe Module:
  - bom:recipes:create
  - bom:recipes:activate

Shipment Module:
  - shipments:ship:create
  - shipments:ship:execute
  - shipments:ship:cancel

Write-offs Module:
  - writeoffs:post
  - writeoffs:cancel

System Settings:
  - settings:modules:update
  - settings:terminology:update
  - settings:users:invite
```

---

## 4. Audit Trail and Immutable History

VisualERP prevents silent modification of inventory logs and operational history.

### 4.1 No Hard Delete for Effective Documents
Once a business document (receipt, transfer, shipment, write-off, inventory audit) transitions from `Draft` to an effective stock-changing status (`Posted` or `Shipped`):
- The database record becomes read-only for general mutations.
- The record cannot be deleted using SQL `DELETE`.
- Corrections must be processed using **Cancellation** (setting status to `Cancelled` and posting reverse stock movement ledger lines).

### 4.2 Security Audits (`AuditLog`)
Every security-sensitive or configuration-altering action must write to the `AuditLog` table.
- **Immutable Log**: The `AuditLog` table only supports `INSERT` operations. `UPDATE` and `DELETE` actions are blocked at the database engine or trigger level.
- **What is logged**:
  - Login attempts (success and failures).
  - Role modifications or user permissions updates.
  - Changes to organization configurations (module toggling, profile applying).
  - Any posting, shipping, or cancellation of transactional documents (references user, document ID, and timestamps).
  - Data changes for auditing (saving JSON differences of modified entities).

---

## 5. Future SaaS Considerations

1. **API Rate Limiting**: Limit API request volume per organization and user to prevent Denial of Service (DoS) conditions.
2. **Encrypted Storage**: Sensitive credentials (e.g., third-party API keys or integration tokens) must be stored encrypted in the database.
3. **Database Schema Migrations**: When deploying schema changes in a multi-tenant environment, migrations must be non-blocking and backwards-compatible to prevent system downtime.
