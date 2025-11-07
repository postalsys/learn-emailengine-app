---
title: Docker Installation
description: Run EmailEngine in Docker containers with Docker Compose
sidebar_position: 5
---

# Running EmailEngine in Docker

Complete guide for running EmailEngine in Docker containers.

## Overview

EmailEngine provides official Docker images for easy deployment:

- **Pre-built images**: Available on Docker Hub and GitHub Container Registry
- **Multi-architecture**: Supports AMD64 and ARM64 (Apple Silicon compatible)
- **Self-contained**: Includes all dependencies except Redis
- **Production-ready**: Suitable for containerized deployments

## Quick Start

### Basic Docker Run

Run EmailEngine with an external Redis instance:

```bash
docker run -d \
  --name emailengine \
  -p 3000:3000 \
  -e EENGINE_REDIS="redis://redis-host:6379" \
  -e EENGINE_SECRET="your-secret-key-at-least-32-chars" \
  postalsys/emailengine:latest
```

Test the installation:

```bash
curl http://localhost:3000/health
# Should return: {"success":true}
```

Access web interface at: `http://localhost:3000`

## Docker Compose (Recommended)

Use Docker Compose to run EmailEngine with Redis.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="official" label="Official Configuration" default>

### Quick Start with Official docker-compose.yml

Download and run the official configuration:

```bash
# Download official docker-compose.yml
curl -LO https://go.emailengine.app/docker-compose.yml

# Generate a secure encryption secret
echo "EENGINE_SECRET=$(openssl rand -hex 32)" > .env

# Start EmailEngine
docker-compose up -d
```

#### What's Included

The official configuration includes:

- **EmailEngine** with API, SMTP, and IMAP proxy ports
- **Redis** with production settings and persistence
- **Health checks** and automatic restarts
- **Environment variable** configuration via `.env` file
- **Logging** with rotation and compression

#### Access Points

After starting:

- **Web UI & API:** http://localhost:3000
- **SMTP Server:** localhost:2525 (for message submission)
- **IMAP Proxy:** localhost:9993 (optional IMAP access)

#### Environment Configuration

Customize settings in `.env` file:

```bash
# Required: Encryption secret (generate with: openssl rand -hex 32)
EENGINE_SECRET=your-generated-secret-here

# Recommended: Redis password for security
REDIS_PASSWORD=your-redis-password

# Optional: Version pinning
EMAILENGINE_VERSION=latest

# Optional: Custom port bindings (default: 127.0.0.1)
EMAILENGINE_API_BIND=0.0.0.0
EMAILENGINE_API_PORT=3000
EMAILENGINE_SMTP_BIND=0.0.0.0
EMAILENGINE_SMTP_PORT=2525
EMAILENGINE_IMAP_BIND=0.0.0.0
EMAILENGINE_IMAP_PORT=9993

# Optional: Performance tuning
EENGINE_WORKERS=4
EENGINE_LOG_LEVEL=info

# Optional: Restart policy
RESTART_POLICY=unless-stopped
```

</TabItem>
<TabItem value="custom" label="Custom Configuration">

### Custom docker-compose.yml

If you prefer to create your own configuration:

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  redis:
    image: redis:7-alpine
    container_name: emailengine-redis
    command: redis-server --appendonly yes --maxmemory-policy noeviction
    volumes:
      - redis-data:/data
    networks:
      - emailengine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  emailengine:
    image: postalsys/emailengine:latest
    container_name: emailengine
    ports:
      - "3000:3000"
    environment:
      - EENGINE_REDIS=redis://redis:6379
      - EENGINE_SECRET=change-this-to-a-random-secret-at-least-32-chars
      - EENGINE_WORKERS=4
      - EENGINE_LOG_LEVEL=info
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - emailengine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  emailengine:
    driver: bridge

volumes:
  redis-data:
    driver: local
```

**Generate secure secret:**

```bash
openssl rand -hex 32
```

Update `EENGINE_SECRET` in the docker-compose.yml with the generated value.

</TabItem>
</Tabs>

### Start Services

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f emailengine
docker-compose logs -f redis

# Check status
docker-compose ps
```

### Stop Services

```bash
# Stop containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers and volumes
docker-compose down -v
```

## Production Deployment

For production deployments, we recommend using the official docker-compose.yml (see "Official Configuration" tab above) with a properly configured `.env` file.

### Production Environment Configuration

Create a production-ready `.env` file:

```bash
# Required: Encryption secret (generate with: openssl rand -hex 32)
EENGINE_SECRET=your-generated-secret-here

# Recommended: Redis password for security
REDIS_PASSWORD=your-secure-redis-password

# Version pinning for stability
EMAILENGINE_VERSION=v2.57.0

# Bind to all interfaces (if behind reverse proxy)
EMAILENGINE_API_BIND=0.0.0.0
EMAILENGINE_SMTP_BIND=0.0.0.0
EMAILENGINE_IMAP_BIND=0.0.0.0

# Performance tuning (adjust based on server resources)
EENGINE_WORKERS=8
EENGINE_LOG_LEVEL=warn

# Automatic restart policy
RESTART_POLICY=unless-stopped
```

### Security Recommendations

1. **Use Redis password:** Set `REDIS_PASSWORD` for production
2. **Pin versions:** Specify exact versions (e.g., `EMAILENGINE_VERSION=v2.57.0`)
3. **Bind to localhost:** If using reverse proxy, keep default `127.0.0.1` binding
4. **Restrict access:** Use firewall rules to limit port access
5. **Enable TLS:** Use reverse proxy (Nginx/Caddy) with HTTPS

### Resource Requirements

For production deployments:

- **Minimum:** 8GB RAM, 4 CPU cores
- **Recommended:** 16GB+ RAM, 8+ CPU cores
- Monitor memory usage: `docker stats emailengine`

### Volumes and Persistence

With the official configuration, redis data is stored in `redis-data` volume:

```yaml
volumes:
  redis-data:
    driver: local
```

To backup redis data:

```bash
# Create backup
docker-compose exec redis redis-cli SAVE
docker cp emailengine-redis:/data/dump.rdb ./backup-$(date +%Y%m%d).rdb

# Restore backup
docker-compose stop redis
docker cp ./backup-20231201.rdb emailengine-redis:/data/dump.rdb
docker-compose start redis
```

### With Custom Redis Configuration

Create `redis.conf`:

```conf
# Persistence
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000

# Memory
maxmemory-policy noeviction

# Performance
tcp-backlog 511
timeout 300
tcp-keepalive 300

# Limits
maxclients 10000

# Security (if needed)
# requirepass your-redis-password
```

If using Redis password, update `.env`:

```bash
EENGINE_REDIS=redis://:your-redis-password@redis:6379
```

### With Reverse Proxy (Nginx)

Add Nginx to `docker-compose.yml`:

```yaml
services:
  # ... redis and emailengine services ...

  nginx:
    image: nginx:alpine
    container_name: emailengine-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - emailengine
    networks:
      - emailengine
    restart: unless-stopped
```

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream emailengine {
        server emailengine:3000;
    }

    server {
        listen 80;
        server_name emailengine.example.com;

        location / {
            proxy_pass http://emailengine;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

## Docker Images

### Available Tags

EmailEngine offers various tag types:

1. **`latest`**: Most recent stable release (recommended)
2. **`v2`**: Latest release in the v2 branch
3. **`v2.x.x`**: Specific version (e.g., `v2.55.4`)
4. **`master`**: Latest commit (unstable, development only)

### Image Sources

**Docker Hub (primary):**

```bash
docker pull postalsys/emailengine:latest
docker pull postalsys/emailengine:v2.55.4
```

**GitHub Container Registry (alternative):**

```bash
docker pull ghcr.io/postalsys/emailengine:latest
```

### Multi-Architecture Support

Images support both AMD64 and ARM64 architectures:

- Intel/AMD processors (x86_64)
- Apple Silicon (M1 and newer)
- ARM servers

Docker automatically pulls the correct architecture.

## Docker Commands

### Container Management

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# Start container
docker start emailengine

# Stop container
docker stop emailengine

# Restart container
docker restart emailengine

# Remove container
docker rm emailengine

# View logs
docker logs emailengine
docker logs -f emailengine  # Follow logs
docker logs --tail 100 emailengine  # Last 100 lines
```

### Image Management

```bash
# List images
docker images

# Pull latest image
docker pull postalsys/emailengine:latest

# Pull specific version
docker pull postalsys/emailengine:v2.55.4

# Remove image
docker rmi postalsys/emailengine:latest

# Remove unused images
docker image prune
```

### Inspect Container

```bash
# View container details
docker inspect emailengine

# View environment variables
docker exec emailengine env

# Access container shell
docker exec -it emailengine sh

# Test health endpoint from inside container
docker exec emailengine curl -f http://localhost:3000/health
```

## Upgrading

### Docker Compose Upgrade

```bash
# Pull latest image
docker-compose pull

# Restart with new image
docker-compose up -d

# View logs to verify
docker-compose logs -f emailengine
```

### Docker Run Upgrade

```bash
# Pull latest image
docker pull postalsys/emailengine:latest

# Stop and remove old container
docker stop emailengine
docker rm emailengine

# Start new container with same configuration
docker run -d \
  --name emailengine \
  -p 3000:3000 \
  -e EENGINE_REDIS="redis://redis-host:6379" \
  -e EENGINE_SECRET="your-secret-key" \
  postalsys/emailengine:latest
```

### Specific Version

```bash
# Use specific version tag
docker pull postalsys/emailengine:v2.55.4

# In docker-compose.yml
services:
  emailengine:
    image: postalsys/emailengine:v2.55.4
```

## Environment Variables

### Required Variables

```bash
EENGINE_REDIS=redis://redis:6379
EENGINE_SECRET=your-secret-key-at-least-32-chars
```

### Optional Variables

```bash
# Performance
EENGINE_WORKERS=4              # Number of worker processes

# API settings
EENGINE_PORT=3000              # HTTP port
EENGINE_HOST=0.0.0.0          # Bind address

# Logging
EENGINE_LOG_LEVEL=info        # trace, debug, info, warn, error
EENGINE_LOG_RAW=false         # Log raw IMAP/SMTP traffic

# Metrics available at /metrics endpoint (requires token with 'metrics' scope)

# Queue settings
EENGINE_QUEUE_NOTIFY=true     # Enable queue notifications
EENGINE_MAX_ATTACHMENT_SIZE=5242880  # 5MB in bytes

# Authentication
EENGINE_APP_NAME=EmailEngine  # Application name
```

See [Configuration Options](/docs/configuration) for complete list.

## Volume Management

### Persistent Data

Redis data is stored in Docker volumes to persist across container restarts.

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect emailengine_redis-data

# Backup volume
docker run --rm -v emailengine_redis-data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz /data

# Restore volume
docker run --rm -v emailengine_redis-data:/data -v $(pwd):/backup alpine tar xzf /backup/redis-backup.tar.gz -C /
```
