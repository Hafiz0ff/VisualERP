# Phase 12: Frontend Mutations and Lifecycle Actions Plan & Report

This document outlines the mutations integration, dropdown loaders, confirmation modal structures, idempotency keys handling, and validation tests for Phase 12.

---

## 1. Centralized Idempotency Key Handling

The frontend client generates unique idempotency keys using the `generateIdempotencyKey()` helper located in `app/src/api/idempotency.ts`:
- **Format**: `ve_<timestamp>_<random>` (e.g. `ve_1719330800000_a1b2c3d4`).
- **Target Headers**: Attached as the `Idempotency-Key` header on all POST requests that alter state (`/post`, `/cancel`, `/start`, `/complete`, `/count`, `/approve`, `/ship`).
- **Retry Mechanism**: The generated key is kept constant during network/timeout retries of the same confirmed user action to prevent double-submit anomalies.

---

## 2. Shared Mutation Services

We implemented type-safe mutations under `app/src/api/services/` that map payload inputs to exact backend schemas:
- **Purchase Receipts**: Draft creation, updates, `/post`, and `/cancel`.
- **Transfers**: Draft creation, updates, `/post`, and `/cancel`.
- **Write-offs**: Draft creation, updates, `/post`, and `/cancel` (single targets map to DTO array `lines`).
- **Production Orders**: Start planning, start order (`/start`), complete order (`/complete` supporting BOM and manual consumption), and cancel order (`/cancel`).
- **Shipments**: Draft creation, updates, ship (`/ship`), and `/cancel`.
- **Inventory Audits**: Draft creation, count submission (`/count`), discrepancy approval (`/approve`), and `/cancel`.

---

## 3. UI Upgrades & User Flow

The following interactive changes have been integrated across the screens:
- **Dynamic Dropdown Loaders**: Replaced static mock values with live dropdown items fetched dynamically:
  - Suppliers: `GET /api/suppliers`
  - Customers: `GET /api/customers`
  - Locations (Warehouses and Workshops): `GET /api/locations`
- **Confirmation Overlays**: Explicit dialogs intercept destructive actions, informing the user about ledger impacts and requiring confirmation before proceeding.
- **Double-Submit Prevention**: Disabled all form buttons and displayed loading states during active requests to block multiple clicks.
- **New Page: Inventory Audits**: Registered a complete audit counting dashboard inside the sidebar that handles creation, counts editing, and final approval cycles.

---

## 4. Production Completion Strategies

To bridge the lack of BOM routes, the completion flow supports:
1. **BOM-Based Completion**: If the production order was created with an explicit BOM, or the backend resolves exactly one active BOM for the same organization and output item, the backend calculates consumption quantities via FIFO resolution.
2. **Explicit Consumption Lines**: Users can toggle manual entry in the complete modal, showing planned raw materials list where actual consumed quantities can be manually edited.

Backend auto-resolution never selects inactive BOMs, BOMs from another organization, or BOMs for another output item. If data inconsistency leaves multiple active BOMs for the same output item, creation returns a conflict instead of selecting an arbitrary BOM.

---

## 5. Verification Results

- **Backend compilation**: Compiled cleanly via `npm run build`.
- **Frontend validation**: Passed type checking via `npx tsc -b`.
- **Frontend bundling**: Bundled cleanly via `vite build`.
- **Seed Validation**: Seed script sets up correct active organization context for the end-to-end flow.
