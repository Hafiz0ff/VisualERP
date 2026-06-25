# Phase 11: Frontend API Client and Read-Only Integration Plan & Report

This document outlines the API client design, organization tenancy setup, screen integrations, known data mismatches, and validation checks for Phase 11.

---

## 1. API Client Design

The frontend API client is built in `app/src/api/` using type-safe abstractions over raw fetch queries:

- **Configurability**: Configured through Vite environment variables (`import.meta.env.VITE_API_URL || 'http://localhost:3000'`).
- **Tenancy Injection**: The fetch wrapper in `client.ts` automatically attaches the `X-Organization-Id` header to every request, retrieved dynamically from local storage.
- **Envelope Parser**: Automatically parses standardized success and paginated envelopes:
  - Success: `{ data: T }`
  - Paginated List: `{ data: T[], pagination: { total, page, pageSize } }`
- **Error Parser**: Formats validation schemas, network failures, and tenancy errors into a custom `ApiError` class. Automatically broadcasts toasts using the `sonner` framework.
- **useApiQuery Hook**: Encapsulates react state, page reloads, abort triggers, and automatic re-fetches upon global organization selector changes.

---

## 2. Organization Header Handling

Since authentication is deferred to future stages:
- The active organization ID is cached in `localStorage` (`visual_erp_active_org_id`).
- Defaults to `VITE_ORGANIZATION_ID` when provided, otherwise to the default seeded organization UUID (`93322c71-d524-41d6-ac41-99b7acbcfd5c`).
- An organization dropdown selector is integrated into `app/src/components/layout/Layout.tsx` header (Topbar).
- Switching organizations updates local storage and broadcasts an `'organization-changed'` event, forcing all active `useApiQuery` instances to reload data instantly.

---

## 3. Integrated Read-Only Screens

The following screens have been integrated with backend data:

- **Dashboard**: Connected to `GET /api/dashboard`. Displays live stock metrics, monthly order counters, pending document summaries, and recent activity logs.
- **Raw Materials**: Connected to `GET /api/items?pageSize=100` and `GET /api/stock/balances`. Maps active items to warehouse/workshop stock levels.
- **Products**: Connected to `GET /api/items?pageSize=100`, `GET /api/stock/balances`, and completed production orders history to calculate daily/monthly output numbers.
- **Incoming Materials**: Connected to `GET /api/purchase-receipts`. List displays receipt dates, total cost, supplier details, and item breakdowns.
- **Transfers**: Connected to `GET /api/transfers`. Clicking a row lazily fetches transfers detail lines from `GET /api/transfers/:id`.
- **Production**: Connected to `GET /api/production-orders`. Lazily loads production details (consumptions and batch specifications) from `GET /api/production-orders/:id`.
- **Shipments**: Connected to `GET /api/shipments`. Row expansion queries `GET /api/shipments/:id` to retrieve line totals and pricing details.
- **Write-offs**: Connected to `GET /api/write-offs`. Lazily loads reasons and targets from `GET /api/write-offs/:id`.
- **Workshop**: Connected to `GET /api/items`, `GET /api/stock/balances`, and `/api/production-orders` to filter workshop location stocks and progressive orders.
- **Reports**: Feeds Recharts widgets (monthly production bars, category pie charts) and stock valuations dynamically using combined backend queries.
- **Audit Log**: Reads recent system logs directly from the dashboard's `recentAuditEvents` stream, mapping operations to Russian action labels.

---

## 4. Known Data Mappings & Mismatches

- **Flat vs. Nested Lines**: Backend queries return nested `line.item` and `line.unit` objects (e.g. `{ item: { name } }`). Mappers in `documents.mapper.ts` have been updated to check both flat (e.g. `line.itemName`) and nested properties.
- **BOM / Recipes**: Since backend does not register `/api/boms` routes yet, the recipes catalog (`Recipes.tsx`) remains mock-based and displays warnings.
- **Low-Stock Alert**: Minimum stock limits are not defined in the backend schema, so the UI keeps alerts empty/disabled and does not calculate fallback thresholds on the client.

---

## 5. Write Actions Intentionally Deferred

The following actions do not call the backend in this phase and trigger alerts warning that write operations are disabled:
- Document creation forms (Purchase Receipts, Transfers, Shipments, Write-offs, Production).
- Document posting and transitions (`/post`, `/cancel`, `/ship`, `/complete`, `/count`, `/approve`).

---

## 6. Verification Results

- Frontend build check: Passed with `tsc -b && vite build`.
- Backend build check: Passed with `tsc`.
- Prisma validate: Schema validated successfully.
- Prisma generate: Client generated successfully.
