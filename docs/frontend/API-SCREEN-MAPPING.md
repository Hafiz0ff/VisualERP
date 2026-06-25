# API Screen Mapping

This document maps all 16 frontend prototype screens to their corresponding backend API endpoints, DTOs, required permissions, and UI states.

Format convention: if a screen omits `Secondary API endpoints`, `Lifecycle actions`, or `Notes`, the value is `None`. Screens that depend on future backend work are marked explicitly with `Planned API endpoints` and `Notes`.

---

## 1. Dashboard
* **Purpose**: Display main KPI cards, pending tasks, and recent activity.
* **Primary API endpoints**:
  - `GET /api/dashboard`
* **Required permissions**:
  - `dashboard:read`
* **Main data objects**:
  - `DashboardResponse`
* **Filters**: None.
* **Actions**:
  - Refresh dashboard data.
* **Empty state**: Show `0` or empty charts for metrics, show "No recent activity" if audit log is empty.
* **Loading state**: Shimmer/skeleton loader for cards and lists.
* **Error state**: Global error toast with option to retry.

---

## 2. Raw Materials / Items
* **Purpose**: View and manage the catalog of raw materials, components, and packaging.
* **Primary API endpoints**:
  - `GET /api/items` (filtered by type: `MATERIAL`, `COMPONENT`, `PACKAGING`, `CONSUMABLE`)
  - `POST /api/items`
  - `PATCH /api/items/:id`
* **Secondary API endpoints**:
  - `GET /api/item-categories`
* **Required permissions**:
  - `items:read`
  - `items:create` (for add button)
  - `items:update` (for edit action)
* **Main data objects**:
  - `Item`
  - `ItemCategory`
* **Filters**: Category, Item Type, Active status, Search string.
* **Actions**: Add Item, Edit Item, Toggle Active Status.
* **Empty state**: Show "No raw materials found. Add your first item."
* **Loading state**: Skeleton table lines.
* **Error state**: Toast notification with API validation messages.

---

## 3. Stock / Warehouse
* **Purpose**: Real-time overview of current warehouse stock levels.
* **Primary API endpoints**:
  - `GET /api/stock/balances/by-location/:locationId`
* **Secondary API endpoints**:
  - `GET /api/locations` (filtered by type: `WAREHOUSE`)
* **Required permissions**:
  - `locations:read`
  - `stock_reports:read`
* **Main data objects**:
  - `LocationBalanceDetail`
  - `StockLocation`
* **Filters**: Active warehouse select.
* **Actions**: Select warehouse location.
* **Empty state**: Show "No stock currently stored in this warehouse."
* **Loading state**: Table header with spinner.
* **Error state**: Inline error card.

---

## 4. Purchase Receipts
* **Purpose**: Record and post raw materials ingestion from suppliers.
* **Primary API endpoints**:
  - `GET /api/purchase-receipts`
  - `POST /api/purchase-receipts`
  - `GET /api/purchase-receipts/:id`
  - `PATCH /api/purchase-receipts/:id`
  - `POST /api/purchase-receipts/:id/post`
  - `POST /api/purchase-receipts/:id/cancel`
* **Required permissions**:
  - `purchase_receipts:read`
  - `purchase_receipts:create`
  - `purchase_receipts:update`
  - `purchase_receipts:post`
  - `purchase_receipts:cancel`
* **Main data objects**:
  - `PurchaseReceipt`
  - `PurchaseReceiptLine`
  - `Supplier`
  - `StockLocation`
* **Filters**: Date range, status (`DRAFT`, `POSTED`, `CANCELLED`), supplier.
* **Actions**: Create Draft, Update Draft, Post Document, Cancel Document.
* **Lifecycle actions**: Post and Cancel require confirmation and an `Idempotency-Key`.
* **Empty state**: Show "No purchase receipts found."
* **Loading state**: Table skeleton, spinner inside detail modal/drawer.
* **Error state**: Modal validation message card.

---

## 5. Transfers
* **Purpose**: Document warehouse-to-workshop or warehouse-to-warehouse stock transfers.
* **Primary API endpoints**:
  - `GET /api/transfers`
  - `POST /api/transfers`
  - `GET /api/transfers/:id`
  - `PATCH /api/transfers/:id`
  - `POST /api/transfers/:id/post`
  - `POST /api/transfers/:id/cancel`
* **Required permissions**:
  - `transfers:read`
  - `transfers:create`
  - `transfers:update`
  - `transfers:post`
  - `transfers:cancel`
* **Main data objects**:
  - `Transfer`
  - `TransferLine`
  - `StockLocation`
* **Filters**: Source location, Target location, status.
* **Actions**: Create Transfer Draft, Edit Transfer, Post Transfer, Cancel Transfer.
* **Lifecycle actions**: Post and Cancel require confirmation and an `Idempotency-Key`.
* **Empty state**: Show "No transfers recorded yet."
* **Loading state**: Skeleton lists.
* **Error state**: Error banner with rollback warnings.

---

## 6. Workshop / Production Area
* **Purpose**: View current stock balances at production workshop locations.
* **Primary API endpoints**:
  - `GET /api/stock/balances/by-location/:locationId`
* **Secondary API endpoints**:
  - `GET /api/locations` (filtered by type: `WORKSHOP`)
* **Required permissions**:
  - `locations:read`
  - `stock_reports:read`
* **Main data objects**:
  - `LocationBalanceDetail`
  - `StockLocation`
* **Filters**: Active workshop select.
* **Actions**: Select workshop.
* **Empty state**: Show "Workshop storage is empty. Transfer raw materials first."
* **Loading state**: Skeleton table grids.
* **Error state**: Card warning banner.

---

## 7. Production Orders
* **Purpose**: Manage production orders through the full manufacturing lifecycle.
* **Primary API endpoints**:
  - `GET /api/production-orders`
  - `POST /api/production-orders`
  - `GET /api/production-orders/:id`
  - `PATCH /api/production-orders/:id`
  - `POST /api/production-orders/:id/start`
  - `POST /api/production-orders/:id/complete`
  - `POST /api/production-orders/:id/cancel`
* **Required permissions**:
  - `production_orders:read`
  - `production_orders:create`
  - `production_orders:update`
  - `production_orders:start`
  - `production_orders:complete`
  - `production_orders:cancel`
* **Main data objects**:
  - `ProductionOrder`
  - `ProductionOrderLine`
  - `BOM`
* **Filters**: Workshop location, status (`PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
* **Actions**: Create Order, Edit Planned Order, Start (lock materials), Complete (BOM-based consumption + output), Cancel.
* **Lifecycle actions**: Start, Complete, and Cancel require confirmation and an `Idempotency-Key`.
* **Empty state**: Show "No production orders scheduled."
* **Loading state**: Detailed drawer spinner, table shimmer.
* **Error state**: Validation notification popup listing missing raw component stocks.

---

## 8. BOM / Recipes
* **Purpose**: View and manage product recipes and material consumption formulas.
* **Primary API endpoints**:
  - Not implemented as runtime routes yet.
* **Planned API endpoints**:
  - `GET /api/boms`
  - `POST /api/boms`
  - `GET /api/boms/:id`
  - `PATCH /api/boms/:id`
  - `POST /api/boms/:id/activate`
* **Required permissions**:
  - `boms:read`
  - `boms:create`
  - `boms:update`
  - `boms:activate`
* **Main data objects**:
  - `BOM`
  - `BOMLine`
  - `Item`
* **Filters**: Target finished product item filter, active version status.
* **Actions**: Create Recipe Version, Modify Recipe Draft, Set Active Version.
* **Empty state**: Show "No recipes created yet."
* **Loading state**: Form fields shimmer.
* **Error state**: Field validation text helpers.
* **Notes**: Phase 10 must treat this as an integration gap. The current backend has BOM data in Prisma/seed and conceptual contracts, but no registered `/api/boms` Fastify routes.

---

## 9. Finished Goods
* **Purpose**: View catalog of finished products.
* **Primary API endpoints**:
  - `GET /api/items` (filtered by type: `FINISHED_PRODUCT`, `SEMI_FINISHED`)
  - `POST /api/items`
  - `PATCH /api/items/:id`
* **Required permissions**:
  - `items:read`
  - `items:create`
  - `items:update`
* **Main data objects**:
  - `Item`
* **Filters**: Active status, SKU search.
* **Actions**: Add Product, Edit Details.
* **Empty state**: Show "No finished products registered in database."
* **Loading state**: Table loading skeleton.
* **Error state**: Red toast notifications.

---

## 10. Shipments
* **Purpose**: Manage finished product dispatches to customers.
* **Primary API endpoints**:
  - `GET /api/shipments`
  - `POST /api/shipments`
  - `GET /api/shipments/:id`
  - `PATCH /api/shipments/:id`
  - `POST /api/shipments/:id/ship`
  - `POST /api/shipments/:id/cancel`
* **Required permissions**:
  - `shipments:read`
  - `shipments:create`
  - `shipments:update`
  - `shipments:ship`
  - `shipments:cancel`
* **Main data objects**:
  - `Shipment`
  - `ShipmentLine`
  - `Customer`
* **Filters**: Customer, status (`DRAFT`, `SHIPPED`, `CANCELLED`).
* **Actions**: Create Shipment, Edit Draft, Ship (execute delivery), Cancel.
* **Lifecycle actions**: Ship and Cancel require confirmation and an `Idempotency-Key`.
* **Empty state**: Show "No shipments dispatched yet."
* **Loading state**: Shimmer lists.
* **Error state**: Warning cards.

---

## 11. Write-offs
* **Purpose**: Document waste, defect items, samples, or warehouse damages.
* **Primary API endpoints**:
  - `GET /api/write-offs`
  - `POST /api/write-offs`
  - `GET /api/write-offs/:id`
  - `PATCH /api/write-offs/:id`
  - `POST /api/write-offs/:id/post`
  - `POST /api/write-offs/:id/cancel`
* **Required permissions**:
  - `write_offs:read`
  - `write_offs:create`
  - `write_offs:update`
  - `write_offs:post`
  - `write_offs:cancel`
* **Main data objects**:
  - `WriteOff`
  - `WriteOffLine`
* **Filters**: Location, reason (`DEFECT`, `DAMAGE`, etc.), status.
* **Actions**: Log Write-off, Edit Draft, Post, Cancel.
* **Lifecycle actions**: Post and Cancel require confirmation and an `Idempotency-Key`.
* **Empty state**: Show "No write-off entries registered."
* **Loading state**: Table skeleton.
* **Error state**: Red error banner.

---

## 12. Inventory Audits
* **Purpose**: Reconcile physical warehouse stock counts.
* **Primary API endpoints**:
  - `GET /api/inventory-audits`
  - `POST /api/inventory-audits`
  - `GET /api/inventory-audits/:id`
  - `PATCH /api/inventory-audits/:id`
  - `POST /api/inventory-audits/:id/count`
  - `POST /api/inventory-audits/:id/approve`
  - `POST /api/inventory-audits/:id/cancel`
* **Required permissions**:
  - `inventory_audits:read`
  - `inventory_audits:create`
  - `inventory_audits:update`
  - `inventory_audits:count`
  - `inventory_audits:approve`
  - `inventory_audits:cancel`
* **Main data objects**:
  - `InventoryAudit`
  - `InventoryAuditLine`
* **Filters**: Location, status (`DRAFT`, `COUNTED`, `APPROVED`, `CANCELLED`).
* **Actions**: Create Audit, Update Count Lines, Count (lock actuals), Approve (posts discrepancy adjustments), Cancel.
* **Lifecycle actions**: Count, Approve, and Cancel require confirmation and an `Idempotency-Key`.
* **Empty state**: Show "No audits recorded."
* **Loading state**: Row spinner.
* **Error state**: Toast notification card.

---

## 13. Stock Reports
* **Purpose**: Analytics on balances matrix, movements ledger, and batch histories.
* **Primary API endpoints**:
  - `GET /api/stock/balances`
  - `GET /api/stock/balances/by-item/:itemId`
  - `GET /api/stock/movements`
  - `GET /api/stock/batches`
  - `GET /api/stock/low-stock`
* **Required permissions**:
  - `stock_reports:read`
  - `stock_movements:read`
  - `stock_batches:read`
* **Main data objects**:
  - `StockBalanceRow`
  - `StockMovement`
  - `StockBatch`
* **Filters**: Item, Location, Date range, Movement type, Batch status.
* **Actions**: Export report (CSV/Excel) - planned.
* **Empty state**: Show "No stock records match filters."
* **Loading state**: Large matrix table skeleton.
* **Error state**: Error box.

---

## 14. Audit Log
* **Purpose**: View historical audit records of all state modifications.
* **Primary API endpoints**:
  - `GET /api/dashboard` (for recent Activity Widget)
* **Planned API endpoints**:
  - `GET /api/audit-logs`
* **Required permissions**:
  - `audit_log:read`
* **Main data objects**:
  - `AuditLogItem`
* **Filters**: User, Entity Type, Date range.
* **Actions**: View changes diff.
* **Empty state**: Show "No audit logs found."
* **Loading state**: List shimmer.
* **Error state**: Access denied message if permission lacks.
* **Notes**: A dedicated audit log route is not registered yet. The current read-only source for recent audit activity is `GET /api/dashboard`.

---

## 15. Settings / Industry Profile
* **Purpose**: View configurations, terminology overrides, and active modules.
* **Primary API endpoints**:
  - `GET /api/organizations/:id`
  - `GET /api/industry-profiles`
* **Planned API endpoints**:
  - `GET /api/settings/modules`
  - `PATCH /api/settings/modules`
  - `GET /api/settings/terminology`
  - `PATCH /api/settings/terminology`
* **Required permissions**:
  - `settings:manage`
* **Main data objects**:
  - `Organization`
  - `TerminologyConfig`
  - `ModuleConfig`
* **Filters**: None.
* **Actions**: Toggle Modules, Modify Terminology Override Custom Labels.
* **Empty state**: Show "No settings found."
* **Loading state**: Form fields spinner.
* **Error state**: Red validation toast.
* **Notes**: Module and terminology management endpoints are documented conceptually but are not registered in the current Fastify app.

---

## 16. Users and Roles
* **Purpose**: Assign user organization memberships and roles.
* **Primary API endpoints**:
  - Not implemented as runtime routes yet.
* **Planned API endpoints**:
  - `GET /api/organizations/:orgId/memberships`
  - `POST /api/users/invite`
  - `PATCH /api/users/:userId/role`
* **Required permissions**:
  - `settings:manage`
* **Main data objects**:
  - `User`
  - `Role`
  - `UserOrganizationMembership`
* **Filters**: Search name.
* **Actions**: Invite User, Change User Role, Revoke Access.
* **Empty state**: Show "Only you are in the organization."
* **Loading state**: Skeleton grid.
* **Error state**: Action failed alert.
* **Notes**: User and role management remains a future API gap. Phase 11 should not render this as a connected screen until backend routes exist.

---

## Phase 11 Integration Status

Completed on 2026-06-25. Connected all 11 active screens: Dashboard, Raw Materials, Products, Incoming Materials, Transfers, Production, Shipments, Write-offs, Workshop, Reports, and AuditLog to live backend APIs. Mismatches in flat vs. nested DTO lines are handled cleanly in the DTO mapper functions.
