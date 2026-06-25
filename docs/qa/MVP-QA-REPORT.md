# MVP QA Report

This report summarizes the QA activities, test execution logs, and findings for the VisualERP MVP release (`v0.9.0-beta`).

---

## 1. Test Summary

- **Test Suite**: Programmatic E2E Business Workflow Validation
- **Coverage**: Full material ingestion, transfer, consumption, production, shipment, and physical inventory audit lifecycles.
- **Execution Date**: 2026-06-25
- **Status**: PASSED
- **Total Steps**: 17
- **Failed Steps**: 0

---

## 2. E2E Test Execution Logs

Below is the verified test run log representing the successful E2E workflow:

```text
=== Starting Programmatic E2E Business Workflow Validation ===
Resolved ORG_ID: 96b5ce5e-f5ab-4ca8-8713-5d2e3b25a10b, USER_ID: 7c52c31f-3f14-4300-a28b-197b7a1d3502
1. Loading seeded items...
Seeded items verified.
2. Loading seeded locations...
Using Warehouse: Main Warehouse, Workshop: Workshop 1
3. Loading seeded suppliers and customers...
Using Supplier: Global Raw Materials LLC, Customer: BuildTech Solutions
4. Creating draft Purchase Receipt...
Draft Purchase Receipt created with ID: 70475bd7-2ad2-4d4a-85b7-8fdcd9269e28
5. Posting Purchase Receipt...
Purchase Receipt posted successfully. Status: POSTED
Stock balance of Cement at Warehouse after PR: 1000 kg
6. Creating draft Transfer to Workshop...
Draft Transfer created with ID: 19068eba-b387-4ad6-8810-be5a06e82c99
7. Posting Transfer...
Transfer posted successfully. Status: POSTED
Stock balance of Cement at Workshop after Transfer: 500 kg
8. Creating planned Production Order for 20 bags of Tile Adhesive...
Planned Production Order created with ID: eb0fc346-4338-4275-8078-7c41fc4f6c1a
9. Starting Production Order...
Production Order started. Status: IN_PROGRESS
10. Completing Production Order (BOM-based consumption)...
Production Order completed. Status: COMPLETED
Stock balance of Finished Adhesive at Warehouse: 20 bags
Remaining Cement balance in Workshop: 299 kg
11. Creating draft Customer Shipment...
Draft Shipment created with ID: db83f24a-cb7c-48bb-8f74-f564c1bdadc3
12. Shipping the Shipment...
Shipment shipped successfully. Status: SHIPPED
Stock balance of Finished Adhesive at Warehouse after Shipment: 8 bags
13. Creating draft Inventory Audit...
Draft Inventory Audit created with ID: e306e08c-11f7-4456-af35-e2af40345e8a
14. Submitting physical counts (reporting 10 bags instead of expected 8)...
Inventory Audit counted. Status: COUNTED
15. Approving Inventory Audit adjustments...
Inventory Audit approved. Status: APPROVED
Final Stock balance of Finished Adhesive at Warehouse after Audit approval: 10 bags
16. Fetching Dashboard metrics...
Dashboard Stock Summary Items: 5
Dashboard Production Completed this month: 1
Dashboard Shipment count shipped this month: 1
17. Checking Audit Logs...
Audit Logs checked successfully.
Latest activity in logs: Инвентаризация: утверждение
=== Programmatic E2E Business Workflow Validation PASSED Successfully ===
```

---

## 3. Findings Severity Breakdown

| Severity | Category | Description | Status |
| :--- | :--- | :--- | :--- |
| **P0** | - | No blocking data-loss or startup issues found in the executed MVP workflow. | Passed |
| **P1** | Production Orders | Production completion resolved and checked raw material stock at the output location instead of the order workshop. | Fixed |
| **P1** | E2E Script | E2E batches used fixed identifiers, making repeated validation runs collide with previous test data. | Fixed |
| **P2** | E2E Script | Initial script used broad `any` typing and hardcoded request key patterns. | Fixed |
| **P2** | Deployment | Docker Compose initially embedded placeholder secrets directly in service environment values. | Fixed |
| **P2** | Fastify | Logging could include authorization headers or password fields if future auth endpoints add those payloads. | Fixed |
| **P2** | Dependencies | Production dependency audits reported high advisories in Fastify 4 transitive dependencies and frontend lodash. | Fixed |

---

## 4. Key QA Validations

1. **End-to-End Stock Ledger**: Executed the full workflow from purchase receipt through inventory audit and confirmed ledger-derived stock balances after each major mutation.
2. **Production Consumption Location**: Verified production completion consumes materials from the production order workshop while output stock is posted to the requested output location.
3. **Organization Header Requirement**: Reviewed global request hooks; tenant-scoped routes require a valid `X-Organization-Id` header before handlers run.
4. **Idempotency Behavior**: Reviewed database-backed idempotency implementation; same key/method/path/body replays cached responses, conflicting payloads are rejected, and pending failed requests are cleared.
5. **Prisma seed integrity**: Confirmed that `npm run db:seed` runs successfully and initializes the demo organization required by the E2E script.

---

## 5. Edge Case Review

| Area | Result |
| :--- | :--- |
| Zero/negative quantities | Covered by Zod DTO validation and service-level stock checks; negative stock attempts remain blocked before ledger posting. |
| Duplicate batches | Purchase receipt batch handling was reviewed; the E2E script now uses unique batch numbers per run to avoid false collisions. |
| Wrong organization / wrong batch item | Service queries scope entities by `organizationId`; batch lookups also require matching `itemId`. |
| Double-submit lifecycle actions | Database-backed idempotency keys protect lifecycle endpoints from repeated execution. |
| Multiple active BOMs | Production order creation returns conflict instead of selecting an arbitrary BOM. |
| Expired idempotency keys | Existing service deletes expired keys and allows fresh execution after the retention window. |
| Browser refresh / back button / network timeout | Reviewed at frontend-service level; full browser automation is deferred to Phase 14 hardening tests. |
| Concurrent posting | Idempotency and document status checks reduce risk; high-concurrency stress testing is deferred. |

---

## 6. Performance Review

No premature optimization was introduced. Current performance posture:

- Dashboard and stock reports aggregate from indexed stock movement, document, item, location, and batch tables.
- Large list endpoints use pagination query schemas.
- Prisma includes were reviewed for MVP-sized pilot data; no measured slow query was found during local validation.
- Recommended Phase 14/15 work: add measured query timings under pilot data volume before changing indexes or query shapes.

---

## 7. Security Review

Confirmed MVP security posture:

- Tenant-scoped routes require `X-Organization-Id` and apply organization filters in services.
- Route payloads are Zod-validated before service execution.
- Fastify logging redacts `Authorization`, `password`, and `passwordHash` fields.
- Docker Compose no longer embeds production secret values directly; it reads them from `.env.production`.
- Backend Fastify was upgraded to the safe v5 line and frontend lodash was updated; `npm audit --omit=dev` reports zero vulnerabilities for both backend and frontend packages.

Deferred by design for beta:

- Real JWT authentication.
- Enforced RBAC permission checks.
- Password lifecycle and session management.
- Full browser permission gating.
