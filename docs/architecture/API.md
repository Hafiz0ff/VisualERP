# Future API Draft

This document outlines future API groups. It does **not** authorize implementation yet.

## API Style

Recommended baseline:

- JSON over HTTP
- REST-style resource groups
- explicit versioning when public contracts stabilize
- request validation at boundaries
- consistent error shape

## API Groups

### Auth

Purpose:

- sign in;
- session refresh;
- sign out;
- current user identity.

Potential endpoints:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Items

Purpose:

- manage `Item`, `ItemCategory`, and `Unit`.

Potential endpoints:

- `GET /api/items`
- `POST /api/items`
- `GET /api/items/:id`
- `PATCH /api/items/:id`
- `GET /api/item-categories`
- `GET /api/units`

### Warehouses

Purpose:

- manage storage locations and warehouse visibility.

Potential endpoints:

- `GET /api/warehouses`
- `POST /api/warehouses`
- `PATCH /api/warehouses/:id`

### Stock

Purpose:

- query balances and movement history.

Potential endpoints:

- `GET /api/stock/balances`
- `GET /api/stock/movements`
- `GET /api/stock/batches`

### Receipts

Purpose:

- record inbound stock from purchase or manual intake.

Potential endpoints:

- `GET /api/receipts`
- `POST /api/receipts`
- `GET /api/receipts/:id`

### Transfers

Purpose:

- move stock between warehouse and workshop contexts.

Potential endpoints:

- `GET /api/transfers`
- `POST /api/transfers`
- `GET /api/transfers/:id`

### Production

Purpose:

- manage production orders, consumption, and output.

Potential endpoints:

- `GET /api/production-orders`
- `POST /api/production-orders`
- `POST /api/production-orders/:id/consume`
- `POST /api/production-orders/:id/output`

### BOM

Purpose:

- manage recipes and product compositions.

Potential endpoints:

- `GET /api/boms`
- `POST /api/boms`
- `PATCH /api/boms/:id`

### Shipments

Purpose:

- manage outbound documents.

Potential endpoints:

- `GET /api/shipments`
- `POST /api/shipments`
- `GET /api/shipments/:id`

### Write-offs

Purpose:

- manage loss, spoilage, and manual stock reduction.

Potential endpoints:

- `GET /api/write-offs`
- `POST /api/write-offs`
- `GET /api/write-offs/:id`

### Reports

Purpose:

- return summarized business information.

Potential endpoints:

- `GET /api/reports/stock`
- `GET /api/reports/production`
- `GET /api/reports/shipments`
- `GET /api/reports/write-offs`

### Audit Log

Purpose:

- expose auditable actions with proper permission checks.

Potential endpoints:

- `GET /api/audit-log`

### Settings

Purpose:

- manage organization settings, industry profile, and module config.

Potential endpoints:

- `GET /api/settings/organization`
- `PATCH /api/settings/organization`
- `GET /api/settings/industry-profile`
- `PATCH /api/settings/industry-profile`
- `GET /api/settings/modules`

## Notes for Later Phases

- Do not implement these routes before Phase 3.
- Final request and response contracts should follow the approved domain model.
- Permission checks should be tied to actions, not only route groups.
