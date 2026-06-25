# Database Backup Guide

This document describes how to perform manual backups and automate daily backups for the PostgreSQL database in VisualERP.

---

## 1. Manual Backup

To export a full SQL dump of the database manually, run the following command on the host machine:

```bash
# Define target backup filename
BACKUP_FILE="/opt/visualerp/backups/db_backup_$(date +%Y%m%d_%H%M%S).sql"

# Create backup directory if it does not exist
mkdir -p /opt/visualerp/backups

# Export database schema and data using pg_dump inside the container
docker compose exec -t db pg_dump -U postgres -d visualerp > "$BACKUP_FILE"

# Compress the backup file to save space
gzip "$BACKUP_FILE"

echo "Backup created: ${BACKUP_FILE}.gz"
```

---

## 2. Automated Daily Backups (Cron Job)

You can set up a daily cron job to automate backups.

### Step A: Create the Backup Script

Create a script at `/opt/visualerp/backup.sh`:
```bash
sudo nano /opt/visualerp/backup.sh
```

Paste the following script content:
```bash
#!/bin/bash
set -e

# Set environment
PROJECT_DIR="/opt/visualerp"
BACKUP_DIR="$PROJECT_DIR/backups"
DB_USER="postgres"
DB_NAME="visualerp"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

FILENAME="$BACKUP_DIR/db_backup_$(date +%Y-%m-%d_%H%M%S).sql"

# Run pg_dump inside container
cd "$PROJECT_DIR"
docker compose exec -t db pg_dump -U "$DB_USER" -d "$DB_NAME" > "$FILENAME"

# Compress SQL dump
gzip "$FILENAME"

# Delete backups older than RETENTION_DAYS (clean up disk space)
find "$BACKUP_DIR" -type f -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup completed: ${FILENAME}.gz"
```

Make the script executable:
```bash
chmod +x /opt/visualerp/backup.sh
```

### Step B: Configure Cron Job

Open the system crontab:
```bash
crontab -e
```

Add the following line to run the backup script every night at 2:00 AM:
```cron
0 2 * * * /opt/visualerp/backup.sh >> /opt/visualerp/backups/backup.log 2>&1
```

---

## 3. Off-Server Copying (Recommended)

Storing backups on the same disk as the live database is a risk. We recommend copying backups to a secure remote storage (e.g., S3, Google Cloud Storage, or another server) using `rsync` or cloud CLI tools.

Example command to copy backups to a remote server using SCP:
```bash
scp -r /opt/visualerp/backups/* user@backup-server.com:/secure/backups/
```
