# API Architecture Overview

This directory contains the specifications for the VisualERP application programming interface. VisualERP uses a RESTful JSON API style to communicate between clients and backend services.

---

## 1. API Specifications Index

The API contract is divided into the following dedicated specifications:

1. **[API Contract & DTOs](API-CONTRACT.md)**: Defines the standard request/response JSON envelopes, common query filter parameters, idempotency requirements, and full DTO mappings for all 23 endpoint groups.
2. **[Error Catalog & Responses](API-ERRORS.md)**: Outlines standardized HTTP error statuses, error payload shapes, and codes (e.g. `INSUFFICIENT_STOCK`, `VALIDATION_ERROR`, `MODULE_DISABLED`).
3. **[API Permissions Matrix](API-PERMISSIONS.md)**: Details permission string formatting (`module:action`) and role-based access maps for API routes.

---

## 2. Core API Architecture Principles

### 2.1 Multi-Tenant Context
All API endpoints scoping business data (Items, Warehouses, Receipts, Production Orders, etc.) require an authenticated session context. If the client sends `X-Organization-Id`, the backend must validate it against the authenticated user's organization memberships before any tenant-scoped query runs.

### 2.2 Explicit Lifecycle Actions
For document state transitions, the API uses explicit POST action endpoints rather than generic status updates. 
- Example: `POST /api/purchase-receipts/:id/post`
- Example: `POST /api/purchase-receipts/:id/cancel`
This ensures state validation rules and stock movements are processed atomically.

### 2.3 Idempotency Controls
To prevent duplicate execution of stock-affecting operations under poor network conditions, clients must supply the `Idempotency-Key` header on all POST action requests.

### 2.4 Read Model Stock Balances
Stock balances are read-only resources derived dynamically from stock movements:
- `GET /api/stock/balances`
- `GET /api/stock/balances/by-item/:itemId`
- `GET /api/stock/balances/by-location/:locationId`
There are no write endpoints for stock balances. Changes happen exclusively as a side effect of posting transactional business documents.
