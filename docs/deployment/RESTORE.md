# Database Restore Guide

Follow this guide to restore your PostgreSQL database from a previously created backup file in case of data corruption or migration to a new server.

> [!CAUTION]
> Restoring a backup will overwrite the current database schema and delete any data added since the backup was taken. Proceed with extreme caution.

---

## 1. Locate and Extract the Backup File

Find the backup file you want to restore inside `/opt/visualerp/backups/`.

Decompress the backup file:
```bash
# Decompress specific backup
gunzip /opt/visualerp/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz
```
This will produce a raw `.sql` file at `/opt/visualerp/backups/db_backup_YYYYMMDD_HHMMSS.sql`.

---

## 2. Drop and Recreate the Public Schema

To ensure a clean restore without conflict errors, it's best to drop and recreate the `public` database schema inside the PostgreSQL instance:

```bash
# Drop the existing public schema and recreate it
docker compose exec -t db psql -U postgres -d visualerp -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## 3. Restore the SQL Dump

Stream the `.sql` dump into the container's PostgreSQL engine:

```bash
# Perform the restore
docker compose exec -T db psql -U postgres -d visualerp < /opt/visualerp/backups/db_backup_YYYYMMDD_HHMMSS.sql
```

---

## 4. Run Migration Verification

After restoring, it is good practice to run Prisma's validate command to ensure the DB state matches the schema definitions:

```bash
docker compose exec backend npx prisma validate
```

---

## 5. Verify the Restore

1. Restart the backend container to ensure no cached state conflicts:
   ```bash
   docker compose restart backend
   ```
2. Log into the system and verify that historical documents, items, locations, and audit logs are visible and correct.
