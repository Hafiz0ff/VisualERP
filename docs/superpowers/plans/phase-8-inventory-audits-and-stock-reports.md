# Phase 8 — Inventory Audits and Stock Reports

## Checklist

- [x] Inventory Audits schemas (`inventory-audits.schemas.ts`)
- [x] Inventory Audits service (`inventory-audits.service.ts`)
- [x] Inventory Audits routes (`inventory-audits.routes.ts`)
- [x] Stock Reports schemas (`stock-reports.schemas.ts`)
- [x] Stock Reports service (`stock-reports.service.ts`)
- [x] Stock Reports routes (`stock-reports.routes.ts`)
- [x] Route registration in `app.ts`
- [x] Documentation updates
- [x] Verification (build, prisma, seed)

## Audit Corrections

- [x] `POST /api/inventory-audits/:id/count` requires explicit counted lines and recomputes expected quantities from posted stock movements.
- [x] Inventory audit updates are allowed only in `DRAFT`; `COUNTED` audits are locked until approval or cancellation.
- [x] Inventory audit location changes validate tenant scope and active location status.
- [x] Approved audit cancellation checks surplus availability before neutralizing an `INVENTORY_ADJUSTMENT` movement.
- [x] Stock report routes use granular permissions: `stock_reports:read`, `stock_movements:read`, and `stock_batches:read`.
- [x] `GET /api/stock/low-stock` returns a documented limitation instead of using invented minimum stock thresholds.
- [x] Seeded role permissions were aligned with the granular route permission strings.

## Verification

- `npm run build`
- `npx prisma validate`
- `npx prisma generate`
- `npm run db:seed`
- `git diff --check`
