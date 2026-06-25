# Known Limitations

This document lists the deliberate boundaries and limitations of the VisualERP MVP release (`v0.9.0-beta`). These limitations outline what is out of scope for the current pilot release and explain the beta status of the software.

---

## 1. Authentication & Security
- **No User Authentication**: Users are not authenticated via JWT or passwords in this release. The system relies on organization/user scoping via the `X-Organization-Id` and `X-User-Id` HTTP headers passed directly in API requests.
- **Role-Based Access Control (RBAC) Guard Enforcement**: Roles and permissions are fully defined and seeded in the database, but API endpoints only enforce scoping and active memberships; strict permission code checking is stubbed for future authentication phases.

---

## 2. Inventory & Stock Management
- **No Low-Stock Alerts**: The database schema and entities are ready to model minimum stock thresholds, but no warning triggers, notifications, or automatic reorder candidate listings are enabled.
- **Manual Expiration Control**: Expiration dates are stored on stock batches but not actively polled or used to trigger warnings for expired stock candidate exclusions.

---

## 3. Production Workflows
- **Immutable Bills of Materials (BOM)**: BOMs can be created and activated, but editing active BOM lines in the UI is disabled. Updates require creating a new BOM version.
- **No Production Planning Scheduling**: Production orders can be created in a planned state and started, but there is no interactive drag-and-drop calendar or machine capacity planning scheduler.

---

## 4. UI/UX Interface
- **Demo Data Seeding Dependency**: The pilot walkthrough assumes the seeded demo organization, units, items, locations, partners, and active BOM exist. Clean production setup must either run the seed or create equivalent master data before executing business workflows.
- **No Automated Browser Regression Suite Yet**: The frontend builds successfully and mutation flows are wired to the API, but full Playwright-style browser regression coverage is deferred to the next hardening phase.
- **Limited Mobile Verification**: Layouts retain responsive behavior from the prototype, but pilot readiness was validated primarily for desktop warehouse and production office use.
- **No Multi-Currency Conversions**: Although base currency is configured on the organization level, the current MVP processes all currency parameters as raw numeric values without dynamic exchange rate updates.

---

## 5. Deployment & Operations
- **Manual Schema Synchronization**: The current Docker guide uses Prisma schema synchronization commands for the MVP pilot. A formal migration promotion workflow should be introduced before a broader production rollout.
- **Manual Backup Verification**: Backup and restore procedures are documented, but each pilot environment must run a restore drill on staging before relying on backups operationally.
