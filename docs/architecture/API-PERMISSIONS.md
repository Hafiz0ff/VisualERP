# API Permission Specifications

This document defines the granular authorization system for VisualERP. Every API endpoint checks for specific permission strings in the format `module:action` before executing requests.

---

## 1. Permission String Catalog

Permissions are grouped by modules and control access to data actions.

### 1.1 Core Master Data Management
- `items:read` — View item cards and categories.
- `items:create` — Create new items and categories.
- `items:update` — Modify item details.
- `units:manage` — View, create, and manage units and conversion rules.
- `locations:read` — View warehouses and workshops.
- `locations:manage` — Create, edit, and toggle warehouses and workshops.

### 1.2 Warehouse Module
- `purchase_receipts:read` — View receipts.
- `purchase_receipts:create` — Create draft purchase receipts.
- `purchase_receipts:update` — Edit draft purchase receipts.
- `purchase_receipts:post` — Post receipts (adds stock, locks document).
- `purchase_receipts:cancel` — Cancel posted receipts (reverses stock).
- `transfers:read` — View transfers.
- `transfers:create` — Create draft transfers.
- `transfers:update` — Edit draft transfers.
- `transfers:post` — Post transfers (moves stock, locks document).
- `transfers:cancel` — Cancel posted transfers (moves stock back).
- `inventory_audits:read` — View audits.
- `inventory_audits:create` — Create draft audits.
- `inventory_audits:update` — Enter actual count lines in audits.
- `inventory_audits:approve` — Approve audits (posts adjustments).
- `inventory_audits:cancel` — Cancel audits.

### 1.3 Partners
- `suppliers:manage` — View and edit supplier directory.
- `customers:manage` — View and edit customer directory.

### 1.4 BOM / Recipe Module
- `boms:read` — View recipe structures and versions.
- `boms:create` — Create draft recipe specifications.
- `boms:update` — Edit draft recipes.
- `boms:activate` — Mark a recipe version active (and deactivates others).

### 1.5 Production Module
- `production_orders:read` — View production orders and consumptions.
- `production_orders:create` — Create planned production orders.
- `production_orders:update` — Edit planned production details.
- `production_orders:start` — Move order to `IN_PROGRESS`.
- `production_orders:complete` — Complete order, consuming materials and adding finished output.
- `production_orders:cancel` — Cancel order.

### 1.6 Shipments Module
- `shipments:read` — View shipments.
- `shipments:create` — Create draft shipments.
- `shipments:update` — Edit draft shipments.
- `shipments:ship` — Ship goods out and lock the shipment document.
- `shipments:cancel` — Cancel shipment.

### 1.7 Write-offs Module
- `write_offs:read` — View write-offs.
- `write_offs:create` — Create draft write-offs.
- `write_offs:update` — Edit draft write-offs.
- `write_offs:post` — Post write-off (decreases stock).
- `write_offs:cancel` — Cancel write-off.

### 1.8 Audit Log & Settings
- `stock:read` — View derived stock balances, batches, and movement ledger records.
- `stock:post_movement` — Reserved permission for future controlled manual stock movement posting.
- `dashboard:read` — View dashboard summary payloads.
- `audit_log:read` — View system-wide security and mutation logs.
- `settings:manage` — Configure tenant settings, toggle modules, invite users, update currency.

---

## 2. Role-Permission Matrix

VisualERP uses Role-Based Access Control (RBAC). Below is the mapping of permissions to the standard user roles:

| Module Permission | Owner | Admin | Warehouse Mgr | Workshop Master | Shipment Mgr | Auditor |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `items:read` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `items:create` / `update`| ✔ | ✔ | ✔ | ✘ | ✔ | ✘ |
| `units:manage` | ✔ | ✔ | ✔ | ✘ | ✘ | ✘ |
| `locations:read` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `locations:manage` | ✔ | ✔ | ✔ | ✘ | ✘ | ✘ |
| `purchase_receipts:read` | ✔ | ✔ | ✔ | ✘ | ✘ | ✔ |
| `purchase_receipts:create`/`update` | ✔ | ✔ | ✔ | ✘ | ✘ | ✘ |
| `purchase_receipts:post`/`cancel` | ✔ | ✔ | ✔ | ✘ | ✘ | ✘ |
| `transfers:read` | ✔ | ✔ | ✔ | ✔ | ✘ | ✔ |
| `transfers:create`/`update` | ✔ | ✔ | ✔ | ✔ | ✘ | ✘ |
| `transfers:post`/`cancel` | ✔ | ✔ | ✔ | ✔ | ✘ | ✘ |
| `inventory_audits:read` | ✔ | ✔ | ✔ | ✘ | ✘ | ✔ |
| `inventory_audits:create`/`update` | ✔ | ✔ | ✔ | ✘ | ✘ | ✘ |
| `inventory_audits:approve`/`cancel`| ✔ | ✔ | ✔ | ✘ | ✘ | ✘ |
| `suppliers:manage` | ✔ | ✔ | ✔ | ✘ | ✘ | ✘ |
| `customers:manage` | ✔ | ✔ | ✘ | ✘ | ✔ | ✘ |
| `boms:read` | ✔ | ✔ | ✘ | ✔ | ✘ | ✔ |
| `boms:create`/`update` | ✔ | ✔ | ✘ | ✔ | ✘ | ✘ |
| `boms:activate` | ✔ | ✔ | ✘ | ✔ | ✘ | ✘ |
| `production_orders:read` | ✔ | ✔ | ✘ | ✔ | ✘ | ✔ |
| `production_orders:create`/`update` | ✔ | ✔ | ✘ | ✔ | ✘ | ✘ |
| `production_orders:start`/`complete`| ✔ | ✔ | ✘ | ✔ | ✘ | ✘ |
| `production_orders:cancel` | ✔ | ✔ | ✘ | ✔ | ✘ | ✘ |
| `shipments:read` | ✔ | ✔ | ✘ | ✘ | ✔ | ✔ |
| `shipments:create`/`update` | ✔ | ✔ | ✘ | ✘ | ✔ | ✘ |
| `shipments:ship`/`cancel` | ✔ | ✔ | ✘ | ✘ | ✔ | ✘ |
| `stock:read` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `dashboard:read` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `write_offs:read` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `write_offs:create`/`update` | ✔ | ✔ | ✔ | ✔ | ✔ | ✘ |
| `write_offs:post`/`cancel` | ✔ | ✔ | ✔ | ✔ | ✔ | ✘ |
| `audit_log:read` | ✔ | ✘ | ✘ | ✘ | ✘ | ✔ |
| `settings:manage` | ✔ | ✘ | ✘ | ✘ | ✘ | ✘ |
