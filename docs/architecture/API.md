# Conceptual API Draft

This document outlines the conceptual API structure for VisualERP. It defines endpoint groups, expected request parameters, and response structures. 

These endpoints are designed to align directly with the core domain entities defined in [DATA-MODEL.md](DATA-MODEL.md).

---

## 1. Global API Standards

- **Protocol**: HTTPS
- **Data Format**: JSON for requests and responses.
- **Versioning**: Prefixed with version (e.g., `/api/v1/...`).
- **Authentication**: JWT Bearer token in the `Authorization` header.
- **Multi-Tenancy Context**: The active organization is determined by the authenticated user's session context. If a user belongs to multiple organizations, `X-Organization-Id` may be used only as a selector and must always be validated against the authenticated user's memberships before any business query runs.
- **Error Response Shape**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVARIANT_VIOLATION",
      "message": "Cannot cancel document: stock quantity would fall below zero.",
      "details": {
        "itemId": "e5b8d231-8930-4e3a-bf41-4560d2bdf7cc",
        "available": 10.0,
        "requested": 15.0
      }
    }
  }
  ```

---

## 2. API Groups and Endpoints

### 2.1 Organizations & Membership

#### Manage Organizations
- `GET /api/v1/organizations` — List organizations associated with the current user.
- `POST /api/v1/organizations` — Register a new organization (SaaS tenant onboarding).
- `GET /api/v1/organizations/:id` — Retrieve organization details (base currency, settings).
- `PATCH /api/v1/organizations/:id` — Update organization details.

#### User Membership & Roles
- `GET /api/v1/organizations/:orgId/users` — List organization users and their assigned roles.
- `POST /api/v1/organizations/:orgId/users` — Invite user / create membership.
- `DELETE /api/v1/organizations/:orgId/users/:userId` — Revoke user membership.
- `PATCH /api/v1/organizations/:orgId/users/:userId/role` — Change user's role.

---

### 2.2 Settings, Industry Profiles & Modules

#### Industry Profiles
- `GET /api/v1/industry-profiles` — List all available system-wide profiles (`dry_mixes`, `food`, `dairy`, `tools`, etc.).
- `POST /api/v1/settings/industry-profile/apply` — Apply an industry profile to the active organization (initializes default categories and terminology mapping).

#### Terminology Config
- `GET /api/v1/settings/terminology` — Retrieve custom terminology mapping.
- `PATCH /api/v1/settings/terminology` — Override standard terms (e.g., customize "BOM" to show as "Рецептура").

#### Module Configuration
- `GET /api/v1/settings/modules` — List available modules and their status (enabled/disabled).
- `PATCH /api/v1/settings/modules` — Enable/disable specific modules for the organization.

---

### 2.3 Items & Units (Master Data)

#### Items
- `GET /api/v1/items` — Query items.
  - **Query Filters**: `type` (material, component, finished_product, etc.), `isActive` (true/false), `categoryId`, `search` (name or code).
- `POST /api/v1/items` — Create new item.
- `GET /api/v1/items/:id` — Get item details.
- `PATCH /api/v1/items/:id` — Update item details.

#### Categories & Units
- `GET /api/v1/item-categories` — Retrieve category tree.
- `POST /api/v1/item-categories` — Create category.
- `GET /api/v1/units` — List measurement units.
- `POST /api/v1/units` — Create unit.
- `GET /api/v1/unit-conversions` — Retrieve unit conversion rules.
- `POST /api/v1/unit-conversions` — Create conversion factor.

---

### 2.4 Locations & Stock Balances

#### Locations
- `GET /api/v1/locations` — List all StockLocations (warehouses and workshops).
  - **Query Filters**: `type` (warehouse/workshop), `isActive`.
- `POST /api/v1/locations` — Create a stock location.
- `PATCH /api/v1/locations/:id` — Update location settings.

#### Stock Balances & Batches
- `GET /api/v1/stock/balances` — Retrieve current inventory balances.
  - **Query Filters**: `locationId`, `itemId`, `batchId`.
  - **Response Payload**: List of `{ itemId, itemName, locationId, locationName, batchId, batchNumber, quantity, unitSymbol }`.
- `GET /api/v1/stock/batches` — List active stock batches.
  - **Query Filters**: `itemId`, `locationId`, `status` (quarantine, approved, expired).
- `GET /api/v1/stock/movements` — Retrieve historical stock movements (ledger list).

---

### 2.5 Purchase Receipts

- `GET /api/v1/receipts` — Query receipt documents.
  - **Query Filters**: `status` (draft, posted, cancelled), `targetLocationId`, `startDate`, `endDate`.
- `POST /api/v1/receipts` — Create a draft receipt.
- `GET /api/v1/receipts/:id` — Get receipt details with lines.
- `PATCH /api/v1/receipts/:id` — Update draft receipt details.
- `POST /api/v1/receipts/:id/post` — Post the receipt (freezes fields, creates stock movements, initializes batches).
- `POST /api/v1/receipts/:id/cancel` — Cancel a posted receipt (creates reversing stock movements).

---

### 2.6 Transfers

- `GET /api/v1/transfers` — Query transfer documents.
- `POST /api/v1/transfers` — Create a draft transfer (specifies source and target locations).
- `GET /api/v1/transfers/:id` — Get transfer details.
- `PATCH /api/v1/transfers/:id` — Update draft transfer.
- `POST /api/v1/transfers/:id/post` — Post transfer (moves stock from source to target).
- `POST /api/v1/transfers/:id/cancel` — Cancel transfer (moves stock back).

---

### 2.7 BOM / Recipe (Specifications)

- `GET /api/v1/boms` — List BOM configurations.
- `POST /api/v1/boms` — Create a new BOM version for an item.
- `GET /api/v1/boms/:id` — Get BOM details with composition lines.
- `PATCH /api/v1/boms/:id` — Edit BOM details (only editable if not yet activated or if version changes).
- `POST /api/v1/boms/:id/activate` — Set this BOM version as active (deactivates other versions for the same item).

---

### 2.8 Production Orders

- `GET /api/v1/production-orders` — Query production orders.
  - **Query Filters**: `status` (planned, in_progress, completed, cancelled), `workshopLocationId`.
- `POST /api/v1/production-orders` — Create a planned production order (allocates expected inputs based on active BOM).
- `POST /api/v1/production-orders/:id/start` — Transition status to `in_progress`.
- `POST /api/v1/production-orders/:id/consume` — Record actual raw materials consumption.
  - **Request Body**: `{ lines: [ { itemId, batchId, quantity, unitId } ] }`
- `POST /api/v1/production-orders/:id/output` — Record finished product outputs.
  - **Request Body**: `{ lines: [ { itemId, quantity, unitId, batchNumber, expirationDate } ] }`
- `POST /api/v1/production-orders/:id/complete` — Complete order and close production loop.
- `POST /api/v1/production-orders/:id/cancel` — Cancel order.

---

### 2.9 Shipments

- `GET /api/v1/shipments` — Query shipments.
- **Query Filters**: `status` (`draft`, `shipped`, `cancelled`), `customerId`, `sourceLocationId`, `startDate`, `endDate`.
- `POST /api/v1/shipments` — Create draft shipment document.
- `GET /api/v1/shipments/:id` — Get shipment details and lines.
- `PATCH /api/v1/shipments/:id` — Update draft shipment.
- `POST /api/v1/shipments/:id/ship` — Mark shipment as `shipped` and create stock movements.
- `POST /api/v1/shipments/:id/cancel` — Cancel shipment (returns stock).

---

### 2.10 Write-offs

- `GET /api/v1/write-offs` — Query write-offs.
- `POST /api/v1/write-offs` — Create draft write-off.
  - **Required Fields**: `locationId`, `reason` (technological_loss, defect, damage, etc.).
- `PATCH /api/v1/write-offs/:id` — Update draft write-off.
- `POST /api/v1/write-offs/:id/post` — Post write-off (decreases stock).
- `POST /api/v1/write-offs/:id/cancel` — Cancel write-off.

---

### 2.11 Inventory Audits

- `GET /api/v1/audits` — Query inventory audits.
- `POST /api/v1/audits` — Start a new audit for a location (calculates expected stock).
- `GET /api/v1/audits/:id` — Get audit lines (expected vs. actual).
- `PATCH /api/v1/audits/:id/lines` — Update actual physical quantities found.
- `POST /api/v1/audits/:id/post` — Post audit (calculates discrepancies and posts correcting stock movements).
- `POST /api/v1/audits/:id/cancel` — Cancel audit (reverses adjustments).

---

### 2.12 Reports

- `GET /api/v1/reports/stock-ledger` — Detailed ledger of movements for audit trail.
- `GET /api/v1/reports/stock-turnover` — Turnover speed and aging of batches.
- `GET /api/v1/reports/production-yield` — Planned vs actual consumption variance reporting.
- `GET /api/v1/reports/write-off-summary` — Summary of losses grouped by reason code.

---

### 2.13 Audit Logs

- `GET /api/v1/audit-logs` — Expose system audit trail.
  - **Query Filters**: `userId`, `action`, `entityType`, `startDate`, `endDate`.
  - **Permissions**: Restricted to users with the `Owner` or `Auditor` system role.
