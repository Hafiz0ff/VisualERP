# UI Rules

VisualERP is a B2B product. The interface should prioritize clarity, speed, and confidence over decoration.

## Core Principles

- simple tables;
- clear forms;
- large readable numbers;
- obvious statuses;
- fast data entry paths.

## UX Expectations

Many users may be coming from Excel-style workflows. The UI should therefore:

- minimize surprises;
- keep columns and totals readable;
- make filters and search easy to understand;
- avoid overly abstract navigation.

## Visual Direction

- minimal decoration;
- no unnecessary animations;
- strong emphasis on readability and operational confidence;
- visual hierarchy based on importance of data, not marketing aesthetics.

## Form Design

- labels must be explicit;
- critical actions should be confirmed when needed;
- validation errors should be clear and local to the field or action;
- quantities, units, and totals should be visually hard to misread.

## Backend Integration Rules

- use one shared API client instead of direct `fetch` calls scattered across components;
- all tenant-scoped requests must include the active `X-Organization-Id`;
- lifecycle buttons must create and preserve an `Idempotency-Key` for retries of the same payload;
- list, detail, dashboard, and report views must render loading, empty, permission-denied, and error states;
- stock quantities shown in the UI must come from backend ledger/report endpoints, not from independent client-side stock calculations;
- screens for planned backend routes must be visibly disabled or marked as planned instead of silently calling non-existent endpoints.

## Device Scope

Desktop is the primary target for MVP. Mobile support can be added later for selected workflows such as warehouse operations and approvals.

---

## Phase 11 & 12 UI Rules Status

- **Phase 11 (Completed)**: Verified and formatted loading skeletons, error screens, empty state visuals, and dynamic backend value calculations across the desktop UI shell.
- **Phase 12 (Completed)**: Connected creation forms, dropdown option loaders, double-submit prevention, confirmation overlays, and centralized idempotency keys for all document workflows. Created a new Inventory Audits page.
