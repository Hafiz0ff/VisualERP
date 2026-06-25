# Frontend State and Error Handling

This document details the required UI behaviors, loading visual cues, error presentation strategies, confirmation prompts, and idempotency patterns for the VisualERP web application.

---

## 1. Visual State Handling

All data-dependent interfaces (tables, analytics, details pages) must support four distinct visual states:

### 1.1 Loading State
* **Expectation**: Prevent layouts from layout-shifting.
* **Component Policy**:
  - Tables: Render a list of 5-10 "skeleton rows" matching the column layout.
  - Analytics/Dashboard cards: Show fading shimmer overlays inside placeholder borders.
  - Modals and drawers: Render a centered loading spinner and disable action buttons.

### 1.2 Empty State
* **Expectation**: Prompt the user with a constructive call-to-action (CTA) instead of leaving a blank table.
* **Component Policy**:
  - Render an illustration or simple icon.
  - Show a clear message (e.g., "No purchase receipts yet").
  - Provide a button to trigger the creation of a new draft document (if the user has create permissions).

### 1.3 Error State
* **Expectation**: Inform the user of request failures without breaking navigation.
* **Component Policy**:
  - Inline Errors: Table bodies render a full-width row with an alert style.
  - Toast Notifications: Validation errors or sudden transient faults trigger floating toasts that automatically clear after 5 seconds.
  - Hard Page Failures: Display a dedicated "Something went wrong" block with a "Retry" button.

### 1.4 Stale State & Queries Invalidation
* **Rule**: Post-mutations must not leave the UI with stale balances or status flags.
* **Query Invalidation Policy**:
  - Immediately after any successful document mutation (start, post, ship, complete, cancel, approve), the frontend **must invalidate and reload** all queries matching:
    1. The details page of that specific document.
    2. The associated listing report (e.g., shipments list).
    3. The stock balance matrices and reports.
    4. The dashboard statistics.

---

## 2. Destructive Actions & Confirmations

Lifecycle actions (`/post`, `/cancel`, `/ship`, `/complete`, `/approve`) are irreversible operations that lock documents and alter stock balances.

### Confirmation Rule
* The UI **must intercept** clicks on these buttons and render a confirmation dialog:
  - **Title**: Obvious action name (e.g., "Поставить на баланс?", "Провести отгрузку?").
  - **Body**: Outline the exact business consequence (e.g., "Это действие изменит складские остатки. Отменить проведение можно будет только созданием корректировочных документов.").
  - **Buttons**: Red/Green colored, primary placement.

---

## 3. Idempotency Key Handling in UI

To prevent duplicate actions caused by double-clicks or unstable connections:

1. **Generation**:
   - The UI generates a unique UUID (v4) for each lifecycle mutation attempt.
   - Attach this key as the `Idempotency-Key` header.
2. **Double-Click Blocking**:
   - Disable the trigger button and show a spinner immediately after the first click.
3. **Retry Strategy**:
   - If the request fails with a network timeout (the server might have received it but failed to reply), **the client must retry using the exact same Idempotency-Key**.
   - If the request returns an explicit conflict (`IDEMPOTENCY_CONFLICT`, HTTP 409), the UI notifies the user that the action is already processing and reloads the document state.
   - If the request returns a client error (`VALIDATION_ERROR` or `INSUFFICIENT_STOCK`), the UI displays the error details and enables the user to correct input. For a subsequent retry, a **new** idempotency key is generated because the payload is different.

---

## Phase 11 & 12 State and Errors Status

- **Phase 11 (Completed)**: Configured loading skeletons, error screens, and empty list visual states across all pages. Direct write operations are bypass-alerted in the UI in a mock-only mode.
- **Phase 12 (Completed)**: Connected creation forms, dropdown option selectors, double-submit blocking, confirmation overlays, and centralized idempotency keys for all document lifecycle actions. Created a new Inventory Audits page.
