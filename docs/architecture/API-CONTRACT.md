# REST API Contract Specifications

This document defines the HTTP request/response payloads, query parameters, headers, and conceptual Data Transfer Objects (DTOs) for VisualERP.

---

## 1. Global Request Headers

All API endpoints scoping organization data require:
- `Authorization`: `Bearer <token>` (JWT token authentication).
- `X-Organization-Id`: `<UUID>` (selects the active tenant for users belonging to multiple organizations; must be validated against `UserOrganizationMembership` before tenant-scoped work begins).
- `Idempotency-Key`: `<UUID>` (optional on reads; **mandatory** on all stock-affecting document state transition endpoints like `/post`, `/cancel`, `/ship`, `/complete`, `/approve`).

---

## 2. API Response Envelopes

### 2.1 Single Resource Success
```json
{
  "data": {
    "id": "e5b8d231-8930-4e3a-bf41-4560d2bdf7cc",
    "name": "Cement PC-500",
    "code": "MAT-CEM-500"
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-06-25T03:52:16.000Z"
  }
}
```

### 2.2 List Collections Success (Paginated)
```json
{
  "data": [
    {
      "id": "e5b8d231-8930-4e3a-bf41-4560d2bdf7cc",
      "name": "Cement PC-500"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  },
  "meta": {
    "requestId": "req_124",
    "timestamp": "2026-06-25T03:52:16.000Z"
  }
}
```

---

## 3. Query Parameter Filters Matrix

For list collection endpoints, the following URL query parameters are supported:

| Name | Type | Description |
| :--- | :--- | :--- |
| `page` | Integer | Pagination page index (default: `1`). |
| `pageSize`| Integer | Number of items per page (default: `20`, max: `100`). |
| `search` | String | Substring search on names, codes, or document numbers. |
| `status` | String | Filter by status value (e.g. `DRAFT`, `POSTED`, `CANCELLED`). |
| `type` | String | Filter by enum types (e.g. `MATERIAL`, `WAREHOUSE`). |
| `itemId` | UUID | Filter records referencing a specific item. |
| `locationId`| UUID | Filter records referencing a specific stock location. |
| `customerId`| UUID | Filter records referencing a customer (for shipments). |
| `supplierId`| UUID | Filter records referencing a supplier (for receipts). |
| `fromDate` | DateTime | Filter transactions occurring on/after this timestamp. |
| `toDate` | DateTime | Filter transactions occurring on/before this timestamp. |
| `sortBy` | String | DB column key to sort by (default: `createdAt`). |
| `sortOrder`| String | Sorting direction (`asc` or `desc`, default: `desc`). |

---

## 4. Idempotency Specification

For stock-altering operations (Posting receipts, completing production, shipping, write-offs, approvals, and cancellations), the client must supply the header `Idempotency-Key: <unique-uuid>`.

- **Same Key + Same Payload**: Server returns the exact same cached response (without executing the database transaction twice).
- **Same Key + Different Payload**: Server returns `409 Conflict` (code `IDEMPOTENCY_CONFLICT`).
- **Storage**: Idempotency keys are stored durably in the `IdempotencyKey` database table. In-memory storage is not acceptable for stock-affecting actions.
- **Failed Handler Cleanup**: If a request fails before a successful response is cached, the pending key is cleared so a corrected retry is not blocked until expiration.
- **Retention**: Keys expire after a configured retention period, initially planned as 24 hours.

---

## 5. REST Endpoint Catalog & DTOs

---

### 5.1 Auth & Tenancy

#### Auth Endpoints
- `POST /api/auth/login` — Authenticate user.
  - **Request (Create DTO)**: `{ email, password }`
  - **Response (Response DTO)**: `{ token, user: { id, email, firstName, lastName } }`
- `POST /api/auth/logout` — Terminate session.
- `GET /api/auth/me` — Retrieve active identity payload.

#### Organizations
- `GET /api/organizations` — List organizations user belongs to.
- `POST /api/organizations` — Create organization tenant.
- `GET /api/organizations/:id` — Get organization settings.
- `PATCH /api/organizations/:id` — Update organization settings.

#### Users & Roles
- `GET /api/users` — List organization users.
- `POST /api/users/invite` — Invite user to organization.
  - **Request DTO**: `{ email, roleId }`
- `PATCH /api/users/:userId/role` — Update user role.

---

### 5.2 Settings & Configuration

#### Industry Profiles
- `GET /api/industry-profiles` — List system profiles.
- `POST /api/settings/apply-profile` — Apply default categories/terminology map.
  - **Request DTO**: `{ profileCode: "dry_mixes" }`

#### Module Config
- `GET /api/settings/modules` — List active module keys.
- `PATCH /api/settings/modules` — Toggle modules.
  - **Request DTO**: `{ moduleKey: "BOM", isEnabled: false }`

#### Terminology Config
- `GET /api/settings/terminology` — Get terminology mappings.
- `PATCH /api/settings/terminology` — Custom overrides.
  - **Request DTO**: `{ key: "BOM", labelCustom: "Рецептура" }`

---

### 5.3 Master Data

#### Units
- `GET /api/units` — List units.
- `POST /api/units` — Create unit.
- `GET /api/unit-conversions` — List conversion rules.
- `POST /api/unit-conversions` — Create conversion factor.
  - **Request DTO**: `{ fromUnitId, toUnitId, factor: 1000.000000 }`

#### Items
- `GET /api/items` — Query items.
- `POST /api/items` — Create item.
  - **Request DTO**: `{ name, code, sku, categoryId, unitId, itemType: "MATERIAL" }`
- `GET /api/items/:id` — Get item details.
- `PATCH /api/items/:id` — Update item.

#### Item Categories
- `GET /api/item-categories` — List category tree.
- `POST /api/item-categories` — Create category.
- `GET /api/item-categories/:id` — Get category details.
- `PATCH /api/item-categories/:id` — Update category.

#### Locations
- `GET /api/locations` — Query warehouses and workshops.
- `POST /api/locations` — Create location.
  - **Request DTO**: `{ name, code, type: "WAREHOUSE" }`
- `PATCH /api/locations/:id` — Update location.

---

### 5.4 Suppliers & Customers

#### Suppliers
- `GET /api/suppliers` — Query supplier list.
- `POST /api/suppliers` — Create supplier.
- `PATCH /api/suppliers/:id` — Edit supplier.

#### Customers
- `GET /api/customers` — Query customer list.
- `POST /api/customers` — Create customer.

---

### 5.5 Business Documents & Transactions

---

#### 5.5.1 Purchase Receipts

- `GET /api/purchase-receipts` — List receipts.
- `POST /api/purchase-receipts` — Create draft receipt.
- `GET /api/purchase-receipts/:id` — Retrieve receipt details.
- `PATCH /api/purchase-receipts/:id` — Edit draft receipt.
- `POST /api/purchase-receipts/:id/post` — Post receipt. (Requires `Idempotency-Key`)
- `POST /api/purchase-receipts/:id/cancel` — Cancel receipt. (Requires `Idempotency-Key`)

##### DTO Mappings:
```typescript
// Create DTO (POST /api/purchase-receipts)
interface CreatePurchaseReceiptDTO {
  receiptNumber: string;
  supplierId?: string;
  date: string; // ISO DateTime
  targetLocationId: string; // warehouse type
  lines: {
    itemId: string;
    quantity: number;
    unitId: string;
    batchNumber: string;
    expirationDate?: string; // ISO Date
    costPerUnit: number;
  }[];
}

// Update DTO (PATCH /api/purchase-receipts/:id)
interface UpdatePurchaseReceiptDTO {
  supplierId?: string;
  date?: string;
  lines?: {
    itemId: string;
    quantity: number;
    unitId: string;
    batchNumber?: string;
    expirationDate?: string;
    costPerUnit?: number;
  }[];
}

// Response DTO (GET /api/purchase-receipts/:id)
interface PurchaseReceiptResponseDTO {
  id: string;
  organizationId: string;
  receiptNumber: string;
  supplierId: string | null;
  date: string;
  targetLocationId: string;
  status: "DRAFT" | "POSTED" | "CANCELLED";
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  lines: {
    id: string;
    itemId: string;
    quantity: number;
    unitId: string;
    batchNumber: string;
    expirationDate: string | null;
    costPerUnit: number;
  }[];
}
```

---

#### 5.5.2 Transfers

- `GET /api/transfers` — List transfers.
- `POST /api/transfers` — Create draft transfer.
- `GET /api/transfers/:id` — Get transfer.
- `PATCH /api/transfers/:id` — Edit draft transfer.
- `POST /api/transfers/:id/post` — Post transfer. (Requires `Idempotency-Key`)
- `POST /api/transfers/:id/cancel` — Cancel transfer. (Requires `Idempotency-Key`)

##### DTO Mappings:
```typescript
// Create DTO (POST /api/transfers)
interface CreateTransferDTO {
  transferNumber: string;
  sourceLocationId: string;
  targetLocationId: string;
  date: string;
  lines: {
    itemId: string;
    batchId?: string; // Specific batch to transfer
    quantity: number;
    unitId: string;
  }[];
}

// Response DTO (GET /api/transfers/:id)
interface TransferResponseDTO {
  id: string;
  transferNumber: string;
  sourceLocationId: string;
  targetLocationId: string;
  date: string;
  status: "DRAFT" | "POSTED" | "CANCELLED";
  lines: {
    id: string;
    itemId: string;
    batchId: string | null;
    quantity: number;
    unitId: string;
  }[];
}
```

---

#### 5.5.3 BOM / Recipes

- `GET /api/boms` — List recipes.
- `POST /api/boms` — Create recipe version.
- `GET /api/boms/:id` — Get recipe.
- `PATCH /api/boms/:id` — Edit draft recipe.
- `POST /api/boms/:id/activate` — Activate BOM version.
- `POST /api/boms/:id/deactivate` — Deactivate BOM version.

##### DTO Mappings:
```typescript
// Create DTO (POST /api/boms)
interface CreateBOMDTO {
  outputItemId: string;
  name: string;
  version: string;
  lines: {
    inputItemId: string;
    quantity: number;
    unitId: string;
    wastePercent?: number;
    notes?: string;
  }[];
}

// Response DTO
interface BOMResponseDTO {
  id: string;
  outputItemId: string;
  name: string;
  version: string;
  isActive: boolean;
  lines: {
    id: string;
    inputItemId: string;
    quantity: number;
    unitId: string;
    wastePercent: number | null;
    notes: string | null;
  }[];
}
```

---

#### 5.5.4 Production Orders

- `GET /api/production-orders` — List production orders.
- `POST /api/production-orders` — Create planned order (calculates input line requirements).
- `GET /api/production-orders/:id` — Get order details.
- `PATCH /api/production-orders/:id` — Edit planned order.
- `POST /api/production-orders/:id/start` — Start order (status -> `IN_PROGRESS`).
- `POST /api/production-orders/:id/consume` — Record raw material consumption.
- `POST /api/production-orders/:id/output` — Record produced outputs.
- `POST /api/production-orders/:id/complete` — Complete order. (Requires `Idempotency-Key`)
- `POST /api/production-orders/:id/cancel` — Cancel order. (Requires `Idempotency-Key`)

##### DTO Mappings:
```typescript
// Create DTO (POST /api/production-orders)
interface CreateProductionOrderDTO {
  orderNumber: string;
  targetItemId: string;
  plannedQuantity: number;
  targetUnitId: string;
  bomId?: string; // Optional (Manual mode if null)
  workshopLocationId: string;
  scheduledDate: string;
}

// Consume DTO (POST /api/production-orders/:id/consume)
interface ProductionConsumeDTO {
  itemId: string;
  batchId?: string;
  quantity: number;
  unitId: string;
  sourceLocationId: string; // workshop location
  timestamp: string;
}

// Output DTO (POST /api/production-orders/:id/output)
interface ProductionOutputDTO {
  itemId: string;
  quantity: number;
  unitId: string;
  targetLocationId: string;
  batchNumber: string; // Created batch number
  expirationDate?: string;
  costPerUnit?: number;
  timestamp: string;
}
```

---

#### 5.5.5 Shipments

- `GET /api/shipments` — List shipments.
- `POST /api/shipments` — Create draft shipment.
- `GET /api/shipments/:id` — Get shipment details.
- `PATCH /api/shipments/:id` — Update draft shipment.
- `POST /api/shipments/:id/ship` — Ship out order (status -> `SHIPPED`). (Requires `Idempotency-Key`)
- `POST /api/shipments/:id/cancel` — Cancel shipment. (Requires `Idempotency-Key`)

##### DTO Mappings:
```typescript
// Create DTO (POST /api/shipments)
interface CreateShipmentDTO {
  shipmentNumber: string;
  customerId?: string;
  date: string;
  sourceLocationId: string; // warehouse type
  lines: {
    itemId: string;
    batchId?: string; // specific batch to deduct
    quantity: number;
    unitId: string;
    pricePerUnit?: number;
  }[];
}
```

---

#### 5.5.6 Write-offs

- `GET /api/write-offs` — List write-offs.
- `POST /api/write-offs` — Create draft write-off.
- `GET /api/write-offs/:id` — Get write-off details.
- `PATCH /api/write-offs/:id` — Edit draft write-off.
- `POST /api/write-offs/:id/post` — Post write-off. (Requires `Idempotency-Key`)
- `POST /api/write-offs/:id/cancel` — Cancel write-off. (Requires `Idempotency-Key`)

##### DTO Mappings:
```typescript
// Create DTO (POST /api/write-offs)
interface CreateWriteOffDTO {
  writeOffNumber: string;
  date: string;
  locationId: string;
  reason: "TECHNOLOGICAL_LOSS" | "DEFECT" | "DAMAGE" | "INVENTORY_CORRECTION" | "SAMPLE" | "OTHER";
  description?: string;
  responsibleUserId: string;
  lines: {
    itemId: string;
    locationId: string;
    batchId?: string;
    quantity: number;
    unitId: string;
  }[];
}
```

---

#### 5.5.7 Inventory Audits

- `GET /api/inventory-audits` — List audits.
- `POST /api/inventory-audits` — Start audit (computes system expectations).
- `GET /api/inventory-audits/:id` — Retrieve audit lines.
- `PATCH /api/inventory-audits/:id` — Input actual quantities.
- `POST /api/inventory-audits/:id/count` — Lock counts (status -> `COUNTED`).
- `POST /api/inventory-audits/:id/approve` — Approve adjustments. (Requires `Idempotency-Key`)
- `POST /api/inventory-audits/:id/cancel` — Cancel audit. (Requires `Idempotency-Key`)

##### DTO Mappings:
```typescript
// Create DTO (POST /api/inventory-audits)
interface CreateInventoryAuditDTO {
  auditNumber: string;
  auditDate: string;
  locationId: string;
  auditorUserId: string;
}

// Update Counts DTO (PATCH /api/inventory-audits/:id)
interface UpdateInventoryAuditCountsDTO {
  lines: {
    itemId: string;
    batchId?: string;
    actualQuantity: number;
    unitId: string;
  }[];
}
```

---

### 5.6 Stock Ledger & Reports

#### Stock Balances
- `GET /api/stock/balances` — Query current stock matrix (Derived model).
- `GET /api/stock/balances/by-item/:itemId` — Stock of specific item across locations.
- `GET /api/stock/balances/by-location/:locationId` — Stock of all items at a specific location.
- `GET /api/stock/movements` — Query historical stock movement ledger lines list.
- `GET /api/stock/batches` — List active batches and their statuses.

*Note: All stock balance endpoints dynamically aggregate posted `StockMovementLine` quantities in the database using the formulas defined in the Stock Ledger specification, ensuring transactional accuracy.*

---

### 5.7 Dashboard

- `GET /api/dashboard` — Fetch home analytics cards widget payload.

#### Response DTO:
```json
{
  "data": {
    "stockSummary": {
      "totalItems": 150,
      "totalCategories": 5,
      "totalWarehouseLocations": 2,
      "totalWorkshopLocations": 1
    },
    "lowStockItems": [
      {
        "itemId": "e5b8d231-8930-4e3a-bf41-4560d2bdf7cc",
        "itemName": "Paper Bag 25kg",
        "sku": "PKG-BAG-25",
        "available": 20.0,
        "unitSymbol": "pcs",
        "minimumAlert": 100.0
      }
    ],
    "productionSummary": {
      "plannedCount": 5,
      "inProgressCount": 2,
      "completedTodayCount": 1
    },
    "shipmentSummary": {
      "shippedTodayCount": 3,
      "pendingShipmentCount": 2
    },
    "writeOffSummary": {
      "totalDefectQuantityToday": 25.0,
      "totalTechnologicalLossToday": 120.0
    },
    "pendingDocuments": [
      {
        "documentType": "PurchaseReceipt",
        "documentId": "a988d231-8930-4e3a-bf41-4560d2bdf7dd",
        "documentNumber": "REC-2026-001",
        "status": "DRAFT",
        "createdAt": "2026-06-25T01:00:00.000Z"
      }
    ],
    "recentAuditEvents": [
      {
        "userId": "d77b8d23-8930-4e3a-bf41-4560d2bdf7dd",
        "userName": "Дмитрий Директор",
        "timestamp": "2026-06-25T03:50:00.000Z",
        "action": "DOCUMENT_POST",
        "entityType": "PurchaseReceipt",
        "entityId": "a988d231-8930-4e3a-bf41-4560d2bdf7dd"
      }
    ]
  },
  "meta": {
    "requestId": "req_500",
    "timestamp": "2026-06-25T03:52:16.000Z"
  }
}
```

---

### 5.8 Audit Log

- `GET /api/audit-logs` — Expose mutation logs (Owner/Auditor roles only).
