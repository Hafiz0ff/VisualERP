# VisualERP MVP End-to-End Demo Flow Guide

This document describes the step-by-step end-to-end backend business workflow for VisualERP. It covers the full cycle from database seeding and warehouse ingestion to production execution, customer shipment, physical inventory auditing, and dashboard monitoring.

All steps use standard HTTP REST API queries with `curl`.

---

## Prerequisites & Headers

All requests require:
* A running backend server (by default at `http://localhost:3000`).
* The following headers:
  * `Content-Type: application/json`
  * `X-Organization-Id`: Scopes all requests to the tenant organization (retrieved in Step 1).
  * `Idempotency-Key`: Required for lifecycle actions that change document state (e.g., post, cancel, start, complete, ship, count, approve).

---

## Step 1: Seed the Database & Get Organization Context

Run the database seed script to populate the database with demo users, roles, units, stock locations, items, partners, and the default BOM.

```bash
npm run db:seed
```

Retrieve the seeded organization and demo user details:

```bash
curl -X GET http://localhost:3000/api/organizations
```

Response shape:
```json
{
  "data": [
    {
      "id": "4a187e1f-7bde-454d-b8ea-188b394541bf",
      "name": "VisualERP Demo",
      "baseCurrency": "TJS",
      "locale": "ru"
    }
  ]
}
```

Use the returned organization `id` as `<org-id>` in all subsequent requests.

---

## Step 2: Verify Initial Seeded Dictionaries

Verify that the required master data catalogs are ready.

### 2.1 Verify Units
```bash
curl -X GET http://localhost:3000/api/units \
  -H "X-Organization-Id: <org-id>"
```
*(Find units `kg`, `pcs`, `bag` and their UUIDs).*

### 2.2 Verify Stock Locations
```bash
curl -X GET http://localhost:3000/api/locations \
  -H "X-Organization-Id: <org-id>"
```
*(Note the UUIDs of `WH-MAIN` and `WS-1` workshop).*

### 2.3 Verify Items Catalog
```bash
curl -X GET http://localhost:3000/api/items \
  -H "X-Organization-Id: <org-id>"
```
*(Note the UUIDs of `MAT-CEM-500` (Cement), `MAT-SND-QRT` (Quartz Sand), `MAT-POL-ADD` (Polymer), `PKG-BAG-25` (Packaging Bag), and `FG-ADH-25` (Tile Adhesive)).*

### 2.4 Verify BOM
```bash
curl -X GET http://localhost:3000/api/items/<fg-adh-25-item-id> \
  -H "X-Organization-Id: <org-id>"
```
Verify that the output item links to an active recipe BOM.

### 2.5 Verify Demo Partners
```bash
curl -X GET "http://localhost:3000/api/suppliers?search=Global%20Raw%20Materials" \
  -H "X-Organization-Id: <org-id>"

curl -X GET "http://localhost:3000/api/customers?search=BuildTech" \
  -H "X-Organization-Id: <org-id>"
```
*(Note the UUIDs of `Global Raw Materials LLC` and `BuildTech Solutions`).*

---

## Step 3: Ingest Raw Materials (Purchase Receipt)

We will ingest raw materials into `WH-MAIN` (Main Warehouse).

### 3.1 Create Draft Purchase Receipt
Create a draft receipt for Cement (1,000 kg), Sand (1,500 kg), Polymer (50 kg), and Packaging Bags (150 pcs).

```bash
curl -X POST http://localhost:3000/api/purchase-receipts \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: <org-id>" \
  -d '{
    "date": "2026-06-25T12:00:00.000Z",
    "targetLocationId": "<wh-main-location-id>",
    "supplierId": "<supplier-id>",
    "lines": [
      {
        "itemId": "<cement-item-id>",
        "quantity": 1000,
        "unitId": "<kg-unit-id>",
        "batchNumber": "BATCH-CEM-001",
        "costPerUnit": 1.2
      },
      {
        "itemId": "<sand-item-id>",
        "quantity": 1500,
        "unitId": "<kg-unit-id>",
        "batchNumber": "BATCH-SND-001",
        "costPerUnit": 0.5
      },
      {
        "itemId": "<polymer-item-id>",
        "quantity": 50,
        "unitId": "<kg-unit-id>",
        "batchNumber": "BATCH-POL-001",
        "costPerUnit": 15.0
      },
      {
        "itemId": "<bag-item-id>",
        "quantity": 150,
        "unitId": "<pcs-unit-id>",
        "batchNumber": "BATCH-PKG-001",
        "costPerUnit": 0.2
      }
    ]
  }'
```
*(Saves draft receipt and returns document `id` and sequential document number `REC-xxxxx`).*

### 3.2 Post Purchase Receipt
Post the document to create stock ledger lines. This increases available raw materials in `WH-MAIN`.

```bash
curl -X POST http://localhost:3000/api/purchase-receipts/<receipt-id>/post \
  -H "X-Organization-Id: <org-id>" \
  -H "Idempotency-Key: post-receipt-001"
```

### 3.3 Verify WH-MAIN Stock Balance
```bash
curl -X GET http://localhost:3000/api/stock/balances/by-location/<wh-main-location-id> \
  -H "X-Organization-Id: <org-id>"
```
*(Verify that raw material quantities are increased).*

### 3.4 Capture Batch IDs
```bash
curl -X GET "http://localhost:3000/api/stock/batches?search=BATCH" \
  -H "X-Organization-Id: <org-id>"
```
*(Note the UUIDs of `BATCH-CEM-001`, `BATCH-SND-001`, `BATCH-POL-001`, and `BATCH-PKG-001`).*

---

## Step 4: Transfer Raw Materials to Workshop

Move materials from `WH-MAIN` to `WS-1` (Workshop 1) to prepare for production.

### 4.1 Create Draft Transfer
Transfer Cement (500 kg), Sand (750 kg), Polymer (20 kg), and Packaging Bags (60 pcs).

```bash
curl -X POST http://localhost:3000/api/transfers \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: <org-id>" \
  -d '{
    "date": "2026-06-25T13:00:00.000Z",
    "sourceLocationId": "<wh-main-location-id>",
    "targetLocationId": "<ws-1-location-id>",
    "lines": [
      {
        "itemId": "<cement-item-id>",
        "batchId": "<cement-batch-id>",
        "quantity": 500,
        "unitId": "<kg-unit-id>"
      },
      {
        "itemId": "<sand-item-id>",
        "batchId": "<sand-batch-id>",
        "quantity": 750,
        "unitId": "<kg-unit-id>"
      },
      {
        "itemId": "<polymer-item-id>",
        "batchId": "<polymer-batch-id>",
        "quantity": 20,
        "unitId": "<kg-unit-id>"
      },
      {
        "itemId": "<bag-item-id>",
        "batchId": "<bag-batch-id>",
        "quantity": 60,
        "unitId": "<pcs-unit-id>"
      }
    ]
  }'
```

### 4.2 Post Transfer
Execute the stock transfer.

```bash
curl -X POST http://localhost:3000/api/transfers/<transfer-id>/post \
  -H "X-Organization-Id: <org-id>" \
  -H "Idempotency-Key: post-transfer-001"
```

### 4.3 Verify Workshop Stock Balance
```bash
curl -X GET http://localhost:3000/api/stock/balances/by-location/<ws-1-location-id> \
  -H "X-Organization-Id: <org-id>"
```
*(Verify materials are now present at WS-1).*

---

## Step 5: Execute Production (Production Order)

We will produce 50 bags of "Tile Adhesive 25kg" (`FG-ADH-25`) using the seeded recipe BOM.

### 5.1 Create Planned Production Order
Create a production plan at `WS-1` with target output `50 bags`.

```bash
curl -X POST http://localhost:3000/api/production-orders \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: <org-id>" \
  -d '{
    "targetItemId": "<fg-adh-25-item-id>",
    "plannedQuantity": 50,
    "targetUnitId": "<bag-unit-id>",
    "bomId": "<bom-id>",
    "workshopLocationId": "<ws-1-location-id>",
    "scheduledDate": "2026-06-25T14:00:00.000Z"
  }'
```
*(Returns production order `id` and status `PLANNED`).*

### 5.2 Start Production
Transition the order to `IN_PROGRESS` to lock materials checks.

```bash
curl -X POST http://localhost:3000/api/production-orders/<prod-id>/start \
  -H "X-Organization-Id: <org-id>" \
  -H "Idempotency-Key: start-production-001"
```

### 5.3 Complete Production
Complete the order. This consumes components from `WS-1` (Cement, Sand, Polymer, Bags) and adds Finished Goods (`FG-ADH-25` under the batch number `BATCH-FG-ADH-001`) at `WS-1`.

```bash
curl -X POST http://localhost:3000/api/production-orders/<prod-id>/complete \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: <org-id>" \
  -H "Idempotency-Key: complete-production-001" \
  -d '{
    "actualQuantity": 50,
    "outputBatchNumber": "BATCH-FG-ADH-001",
    "productionLocationId": "<ws-1-location-id>"
  }'
```

### 5.4 Verify Workshop Stock
```bash
curl -X GET http://localhost:3000/api/stock/balances/by-location/<ws-1-location-id> \
  -H "X-Organization-Id: <org-id>"
```
*(Verify finished adhesive is created and raw components are reduced).*

### 5.5 Capture Finished Goods Batch ID
```bash
curl -X GET "http://localhost:3000/api/stock/batches?search=BATCH-FG-ADH-001" \
  -H "X-Organization-Id: <org-id>"
```
*(Note the UUID of `BATCH-FG-ADH-001` for shipment and inventory audit steps).*

---

## Step 6: Dispatch Customer Shipment

Sell finished products directly from the workshop to a customer.

### 6.1 Create Draft Shipment
Ship 10 bags of adhesive (`FG-ADH-25`) to the customer.

```bash
curl -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: <org-id>" \
  -d '{
    "customerId": "<customer-id>",
    "date": "2026-06-25T15:00:00.000Z",
    "sourceLocationId": "<ws-1-location-id>",
    "lines": [
      {
        "itemId": "<fg-adh-25-item-id>",
        "batchId": "<finished-goods-batch-id>",
        "quantity": 10,
        "unitId": "<bag-unit-id>",
        "pricePerUnit": 18.5
      }
    ]
  }'
```

### 6.2 Dispatch Shipment
Subtract goods from stock.

```bash
curl -X POST http://localhost:3000/api/shipments/<shipment-id>/ship \
  -H "X-Organization-Id: <org-id>" \
  -H "Idempotency-Key: ship-goods-001"
```

---

## Step 7: Reconcile Physical Stock (Inventory Audit)

Run a physical audit at `WS-1` to count leftover bags.

### 7.1 Create Inventory Audit
Create a draft audit document for the workshop. Expected quantities are calculated when audit lines are submitted.

```bash
curl -X POST http://localhost:3000/api/inventory-audits \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: <org-id>" \
  -d '{
    "auditDate": "2026-06-25T16:00:00.000Z",
    "locationId": "<ws-1-location-id>"
  }'
```
*(Returns audit `id` with status `DRAFT`).*

### 7.2 Lock Count
Submit counted lines and transition audit status to `COUNTED`. In this demo we find 41 bags instead of the expected 40 bags, so approval will create a surplus adjustment of +1 bag.

```bash
curl -X POST http://localhost:3000/api/inventory-audits/<audit-id>/count \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: <org-id>" \
  -H "Idempotency-Key: count-audit-001" \
  -d '{
    "lines": [
      {
        "itemId": "<fg-adh-25-item-id>",
        "batchId": "<finished-goods-batch-id>",
        "actualQuantity": 41,
        "unitId": "<bag-unit-id>"
      }
    ]
  }'
```

### 7.3 Approve Adjustments
Post discrepancies to the stock ledger. This increases stock balance by +1 bag at `WS-1`.

```bash
curl -X POST http://localhost:3000/api/inventory-audits/<audit-id>/approve \
  -H "X-Organization-Id: <org-id>" \
  -H "Idempotency-Key: approve-audit-001"
```

---

## Step 8: View Dashboard & Check Audit Logs

Retrieve the dashboard summary payload to view statistics for the organization.

```bash
curl -X GET http://localhost:3000/api/dashboard \
  -H "X-Organization-Id: <org-id>"
```

Response template (exact numbers depend on the executed documents in your database):
```json
{
  "data": {
    "stockSummary": {
      "totalStockItems": 5,
      "totalStockLocations": 2,
      "totalStockBatches": 5,
      "totalQtyByType": {
        "MATERIAL": 1000.0,
        "PACKAGING": 90.0,
        "FINISHED_PRODUCT": 41.0
      }
    },
    "lowStockItems": [],
    "productionSummary": {
      "byStatus": {
        "PLANNED": 0,
        "IN_PROGRESS": 0,
        "COMPLETED": 1,
        "CANCELLED": 0
      },
      "completedCurrentMonthCount": 1,
      "latestCompleted": [...]
    },
    "shipmentSummary": {
      "byStatus": {
        "DRAFT": 0,
        "SHIPPED": 1,
        "CANCELLED": 0
      },
      "shippedCurrentMonthCount": 1,
      "latestShipped": [...]
    },
    "writeOffSummary": {
      "byStatus": {
        "DRAFT": 0,
        "POSTED": 0,
        "CANCELLED": 0
      },
      "postedCurrentMonthCount": 0,
      "byReason": {}
    },
    "pendingDocuments": {
      "draftPurchaseReceiptsCount": 0,
      "draftTransfersCount": 0,
      "plannedOrInProgressProductionOrdersCount": 0,
      "draftShipmentsCount": 0,
      "draftWriteOffsCount": 0,
      "countedInventoryAuditsCount": 0
    },
    "recentAuditEvents": [...]
  }
}
```
