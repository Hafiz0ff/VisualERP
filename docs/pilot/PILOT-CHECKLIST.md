# Pilot Readiness Checklist

This document is a verification checklist to ensure that the VisualERP deployment is stable, secure, and ready for deployment at the pilot customer site.

---

## 1. Database & Seeding Integrity
- [ ] Database is running and accessible inside the Docker network.
- [ ] Prisma Client is generated and matches the schema:
  `docker compose exec backend npx prisma validate`
- [ ] Demo seed has been successfully run (or manual clean setup initialized):
  `docker compose exec backend npm run db:seed`
- [ ] Seed verification: Confirm that active BOMs, industry categories, demo user, warehouses, and workshop locations exist.

---

## 2. API & Network Connectivity
- [ ] Health endpoint returns 200 OK:
  `curl http://localhost/api/health`
- [ ] Frontend Nginx reverse proxy routes `/api/*` requests to Fastify backend successfully.
- [ ] CORS is not required because both frontend and API are served from the same domain root origin via Nginx reverse proxy.
- [ ] Host-level firewall is configured to block direct database port 5432 and backend port 3000 from public access. Only ports 80/443 are exposed.

---

## 3. Business Workflows & Data Scoping
- [ ] Organization scoping: All API requests supply the `X-Organization-Id` header.
- [ ] Validation check: Missing `X-Organization-Id` yields an authorization error; wrong-organization entity IDs are rejected by organization-scoped queries.
- [ ] Stock availability asserts are working: Submitting a transfer, shipment, or write-off for more stock than is currently available yields a `VALIDATION_ERROR`.
- [ ] Document lifecycle states: Documents in draft can be modified; posted documents are immutable; cancelled documents can neither be posted nor edited.
- [ ] Sequential numbering: The next number is correctly generated using the sequential counter (e.g. `REC-000001`, `MVT-000001`).

---

## 4. Reports & Observability
- [ ] Dashboard summaries load within 500ms.
- [ ] Stock reports correctly aggregate balances dynamically across locations.
- [ ] Audit logs: lifecycle actions are recorded in the AuditLog database table with user ID, entity type, entity ID, action, and timestamp.
- [ ] Fastify logger is running and is configured to redact authorization headers and body passwords:
  `redact: ['req.headers.authorization', 'req.body.password', 'req.body.passwordHash']`

---

## 5. Backups & Disaster Recovery
- [ ] Daily backup shell script `/opt/visualerp/backup.sh` is configured and executable.
- [ ] System cron tab is configured to trigger backups every day at 2:00 AM:
  `crontab -l | grep backup`
- [ ] Log rotation/retention: Backups older than 14 days are automatically cleaned.
- [ ] Off-server backup synchronization: Backups are regularly synced off-server.
- [ ] Restore validation: The recovery sequence has been dry-run once using [RESTORE.md](../deployment/RESTORE.md) on staging to confirm clean imports.
