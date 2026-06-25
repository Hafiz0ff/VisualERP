# Frontend Integration Plan

This document outlines the architectural plan for integrating the React frontend with the VisualERP backend. It defines the patterns for API requests, header management, global error handling, and file organization.

---

## 1. Unified API Client

To prevent scattered `fetch` or `axios` calls, the frontend must use a single, shared API client instance.

### Core Architecture

1. **Shared Client Instance**: All network requests route through this client.
2. **Organization Context**: Every request must attach the `X-Organization-Id` header. The active organization is read from a global frontend state (e.g., React Context or local storage).
3. **Idempotency Context**: Lifecycle mutations (`post`, `cancel`, `ship`, `complete`, `approve`) must attach an `Idempotency-Key` header with a unique UUID. If a request is retried due to a transient error, **the same key must be reused**.
4. **Base URL Scoping**: Base configuration uses `process.env.REACT_APP_API_URL` (or Vite equivalent) and defaults to `http://localhost:3000`.

### Standard Response Envelope

The backend returns a standardized envelope for all responses:

* **Success Envelope**:
  ```json
  {
    "data": { ... },
    "meta": {
      "requestId": "req_...",
      "timestamp": "..."
    }
  }
  ```

* **Paginated List Envelope**:
  ```json
  {
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 120,
      "totalPages": 6
    },
    "meta": { ... }
  }
  ```

* **Error Envelope**:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human readable message",
      "details": [ ... ]
    },
    "meta": { ... }
  }
  ```

---

## 2. Global Error Handler

The frontend client must intercept HTTP error status codes and translate them into domain-specific user feedback:

| HTTP Status | Error Code | UI Treatment |
| :--- | :--- | :--- |
| **400 Bad Request** | `VALIDATION_ERROR` | Highlight invalid fields locally with error messages. |
| **401 Unauthorized** | `UNAUTHORIZED` | Redirect to Login screen or clear credentials. |
| **403 Forbidden** | `FORBIDDEN` | Show "Access Denied" toast or block UI elements. |
| **403 Forbidden** | `ORGANIZATION_SCOPE_VIOLATION` | Alert user that resource belongs to another company, reload. |
| **404 Not Found** | `NOT_FOUND` | Display standard "Resource not found" page. |
| **409 Conflict** | `IDEMPOTENCY_CONFLICT` | Block and notify that action is already processing/completed. |
| **400 Bad Request** | `INSUFFICIENT_STOCK` | Alert user of stock shortage, block posting. |
| **400 Bad Request** | `INVALID_STATUS_TRANSITION` | Show warning that document cannot transition to this state. |
| **500 Server Error** | `INTERNAL_SERVER_ERROR` | Display global error banner. |

---

## 3. Directory Layout

The frontend codebase should follow a domain-first structure aligned with the backend modules:

```txt
src/frontend/
  api/
    client.ts          # Axios or fetch client configuration
    errors.ts          # Error mapping and toast dispatchers
    idempotency.ts     # Idempotency key generation and storage rules
    types.ts           # Generated/shared TypeScript types
  hooks/
    useApiQuery.ts     # Wrapper hook for loading/fetching data
    useApiMutation.ts  # Wrapper hook for POST/PATCH operations
  context/
    OrganizationContext.tsx # Context managing the active organization ID
  screens/
    dashboard/         # Dashboard statistics widgets
    items/             # Items catalog and categories
    purchase-receipts/ # Purchase Receipt lists and forms
    transfers/         # Location stock transfers
    production-orders/ # Production Orders and recipes
    shipments/         # Customer shipments
    inventory-audits/  # Stock physical counts audits
    stock-reports/     # Matrix, movements, and batches tables
    audit-log/         # Security logs reader
    settings/          # Profile, configurations, and role options
```

---

## 4. Integration Risks & Mitigations

We identify the following frontend integration risks:

1. **Mock Data Discrepancy**: The frontend prototype currently uses static mock data. The table fields and lists might not align 1-to-1 with backend DTOs.
   - *Mitigation*: Refactor table column accessors to match the exact JSON keys documented in `FRONTEND-DATA-CONTRACTS.md`.
2. **Detail Drawers / Modals**: Some prototype screens might show compact views but lack deep details (like document lines).
   - *Mitigation*: Build reusable sliders/drawers to fetch `/api/<resources>/:id` detail DTOs on row selection.
3. **Idempotency Keys**: Network failures can lead to double postings if keys are not kept consistent on retry.
   - *Mitigation*: Store the active key and payload hash in the `useApiMutation` state and reuse it until response is received or explicitly dismissed.
4. **Tenant Selector**: Organization ID selection is simulated via `X-Organization-Id` without proper login credentials.
   - *Mitigation*: Develop a simple dropdown selector on the top nav of the UI to switch between seeded organization IDs.
5. **No Auth Implementation**: The current API allows bypassing login and only expects header context.
   - *Mitigation*: Do not invent a fake JWT. Phase 11 should use an explicit demo organization selector that sets `X-Organization-Id`, then replace it with real auth context in a later Auth phase.
6. **Stock balance derivations**: The UI must not perform independent stock additions or subtractions in client memory.
   - *Mitigation*: Treat the backend ledger as the single source of truth and query report balances matrix directly.
