# Application Update Guide

Follow this guide to safely update VisualERP on your VPS when new features or fixes are released.

---

## 1. Preparation

Before applying any update, it is highly recommended to perform a full database backup. Refer to [BACKUP.md](BACKUP.md) for details.

Ensure you are in the application root directory:
```bash
cd /opt/visualerp
```

---

## 2. Pull Code Changes

Fetch the latest changes from the git repository:
```bash
git fetch origin
git pull origin main
```

---

## 3. Rebuild and Restart Containers

Rebuild the frontend and backend images to incorporate the code changes:
```bash
docker compose --env-file .env.production up -d --build
```
This command performs a zero-downtime container replacement where possible; Docker keeps old containers running until the new build completes.

---

## 4. Run Database Schema Updates

If the database schema has changed, run the prisma synchronization commands inside the running backend container:

```bash
# Push compatible schema changes to the PostgreSQL database
docker compose exec backend npx prisma db push

# Re-generate the Prisma client
docker compose exec backend npx prisma generate
```

Do not use destructive schema synchronization flags on pilot data unless a fresh backup exists and the data-loss impact has been reviewed.

---

## 5. Verify the Update

Check that all containers started correctly and review logs:
```bash
# Check container status
docker compose ps

# View the last 50 lines of logs
docker compose logs --tail=50 -f backend
```

Verify that the version works in your web browser. If you experience cached assets issues, clear your browser cache or perform a hard reload (`Ctrl+F5` / `Cmd+Shift+R`).
