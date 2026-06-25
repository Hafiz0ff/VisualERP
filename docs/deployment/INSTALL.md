# VPS Installation Guide

This document describes how to deploy VisualERP on a clean VPS server running Ubuntu 22.04 LTS (or similar Linux distributions) using Docker and Docker Compose.

---

## 1. System Requirements

- **Operating System**: Ubuntu 22.04 LTS (recommended)
- **CPU**: 1 vCPU or more
- **RAM**: 1 GB minimum (2 GB recommended for compilation)
- **Disk Space**: 10 GB free space
- **Docker**: Engine version 24+ and Docker Compose version 2+

---

## 2. Server Preparation

Update server packages and install Docker:

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker dependencies
sudo apt install -y curl apt-transport-https ca-certificates gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the stable repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Docker Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

Make sure Docker runs on boot:
```bash
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 3. Clone Repository & Setup Environment

Clone the repository to the VPS:
```bash
git clone https://github.com/Hafiz0ff/VisualERP.git /opt/visualerp
cd /opt/visualerp
```

Create the production `.env` file from the template:
```bash
cp .env.production.example .env.production
```

Edit the `.env.production` file to set your custom secrets and secure parameters:
```bash
nano .env.production
```

At minimum, replace `POSTGRES_PASSWORD`, `DATABASE_URL`, `JWT_SECRET`, `APP_URL`, and `FRONTEND_PORT` with environment-specific values. `DATABASE_URL` must use the same password as `POSTGRES_PASSWORD`.

---

## 4. Run Application Containers

Build and run the stack in detached mode:
```bash
docker compose --env-file .env.production up -d --build
```

This will spin up:
1. `db`: PostgreSQL 15 container listening on internal port 5432.
2. `backend`: Fastify API listening on internal port 3000.
3. `frontend`: Nginx container exposing port 80 (or 443 if SSL is configured) to the host.

---

## 5. Initialize the Database

Run database migrations, generate the Prisma client, and seed the demo data inside the backend container:

```bash
# Synchronize the MVP schema inside the container
docker compose exec backend npx prisma db push
docker compose exec backend npx prisma generate

# Seed initial data (categories, units, locations, active BOMs, and demo user)
docker compose exec backend npm run db:seed
```

---

## 6. Verify Deployment

1. Check that all containers are healthy:
   ```bash
   docker compose ps
   ```
2. View application logs to ensure no startup errors:
   ```bash
   docker compose logs -f backend
   ```
3. Verify the proxied health endpoint:
   ```bash
   curl http://your-server-ip/api/health
   ```
4. Open your browser and navigate to your server's IP address (`http://your-server-ip`). You should see the VisualERP interface with demo data populated after seeding.

---

## 7. Configuring HTTPS (SSL)

To secure the VPS deployment, we recommend using Nginx on the host server (or Traefik / Caddy) as a reverse proxy with Let's Encrypt certificates.

Example host Nginx configuration:
```nginx
server {
    listen 80;
    server_name erp.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name erp.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/erp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:80; # Map to docker frontend port, or FRONTEND_PORT if changed
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
