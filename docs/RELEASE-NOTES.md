# VisualERP Release Notes

## v0.9.0-beta - MVP Pilot Candidate

Release date: 2026-06-25

This release packages VisualERP as a pilot-ready MVP for a first controlled manufacturing deployment.

### Included

- Ledger-based warehouse flows: purchase receipts, transfers, write-offs, and stock reports.
- Production orders with workshop material consumption, finished goods output, and optional BOM-based completion.
- Customer shipments with stock deduction and cancellation support.
- Physical inventory audits with counted and approved discrepancy adjustments.
- Dashboard endpoint and frontend dashboard cards backed by live API data.
- Frontend mutation flows for core business documents with confirmation dialogs and idempotency keys.
- Programmatic E2E workflow validation script covering the core stock lifecycle.
- Docker Compose deployment with PostgreSQL persistence, backend API, frontend Nginx reverse proxy, and health checks.
- Deployment, update, backup, restore, pilot checklist, QA report, and known limitations documentation.

### Fixed During Hardening

- Production completion now consumes raw materials from the production order workshop, while output stock is posted to the selected output location.
- E2E validation script now uses typed DTOs, random idempotency keys, and unique batch numbers per run.
- Docker Compose reads production secrets from `.env.production` instead of embedding placeholder values directly.
- Fastify logging redacts authorization and password fields.
- Production dependency audits were cleaned by upgrading Fastify to v5 and updating the frontend lodash dependency.

### Beta Boundaries

- Authentication is not production-grade yet; real JWT sessions and password handling are scheduled for Phase 14.
- RBAC permissions are documented and routed through guards, but strict permission enforcement remains a Phase 14 task.
- Browser automation, load testing, and pilot-volume performance measurements are still required before a wider rollout.

### Upgrade Notes

- Use `docker compose --env-file .env.production up -d --build` for VPS deployment.
- Run `docker compose exec backend npx prisma db push` and `docker compose exec backend npm run db:seed` for the current MVP schema and demo data.
- Take a database backup before every update.
