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
  -e EENGINE_ENCRYPTION_SECRET="your-encryption-secret-32-chars" \
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

### Basic Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

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
      - EENGINE_ENCRYPTION_SECRET=change-this-to-another-random-secret-32-chars
      - EENGINE_WORKERS=4
      - EENGINE_LOG_LEVEL=info
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - emailengine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
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

## Production Setup

### With Environment File

Create `.env` file:

```bash
# Redis connection
EENGINE_REDIS=redis://redis:6379

# Security secrets (CHANGE THESE!)
EENGINE_SECRET=generate-random-secret-at-least-32-characters
EENGINE_ENCRYPTION_SECRET=generate-another-random-secret-32-chars

# Performance
EENGINE_WORKERS=4

# Logging
EENGINE_LOG_LEVEL=info
EENGINE_LOG_RAW=false

# API settings
EENGINE_PORT=3000
EENGINE_HOST=0.0.0.0

# Optional: Enable metrics
EENGINE_METRICS_SERVER=true
EENGINE_METRICS_PORT=9090
```

**Generate secure secrets:**
```bash
# Linux/macOS
openssl rand -hex 32

# Or using Docker
docker run --rm alpine sh -c "head -c 32 /dev/urandom | xxd -p -c 32"
```

Update `docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: emailengine-redis
    command: redis-server --appendonly yes --maxmemory-policy noeviction --maxmemory 2gb
    volumes:
      - redis-data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf:ro
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
      - "9090:9090"  # Metrics port
    env_file:
      - .env
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - emailengine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  emailengine:
    driver: bridge

volumes:
  redis-data:
    driver: local
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
maxmemory 2gb
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
- Apple Silicon (M1/M2/M3)
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
  -e EENGINE_ENCRYPTION_SECRET="your-encryption-secret" \
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
EENGINE_ENCRYPTION_SECRET=your-encryption-secret-32-chars
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

# Metrics
EENGINE_METRICS_SERVER=true   # Enable Prometheus metrics
EENGINE_METRICS_PORT=9090     # Metrics port

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

## Performance Tuning

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  emailengine:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Optimize Redis

```yaml
services:
  redis:
    command: >
      redis-server
      --appendonly yes
      --maxmemory 2gb
      --maxmemory-policy noeviction
      --tcp-backlog 511
      --timeout 300
      --tcp-keepalive 300
```
