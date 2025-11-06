---
title: Docker Deployment
description: Deploy EmailEngine using Docker and Docker Compose with production configurations
sidebar_position: 2
---

# Docker Deployment

Deploy EmailEngine using Docker for a consistent, portable, and easy-to-manage installation.

:::tip Quick Start
```bash
docker pull postalsys/emailengine:v2
docker run -p 3000:3000 \
  --env EENGINE_REDIS="redis://host.docker.internal:6379/7" \
  postalsys/emailengine:v2
```
:::

## Overview

EmailEngine provides official Docker images that support multiple architectures (amd64, arm64), making it easy to run on various platforms including Apple Silicon.

**Benefits of Docker deployment:**
- Isolated environment
- Consistent across dev/staging/production
- Easy version management
- Simple updates and rollbacks
- Portable across cloud providers

## Docker Images

### Official Image Sources

**Docker Hub (Recommended):**
```bash
docker pull postalsys/emailengine:v2
```

**GitHub Container Registry:**
```bash
docker pull ghcr.io/postalsys/emailengine:v2
```

### Available Tags

| Tag | Description | Stability | Use Case |
|-----|-------------|-----------|----------|
| `latest` | Latest commit from master | Unstable | Testing new features |
| `v2` | Latest v2 release | Stable | Production |
| `v2.x.x` | Specific version | Stable | Version pinning |

**Recommended for production:** Use specific version tags (e.g., `v2.48.5`) to control updates.

## Basic Docker Setup

### Single Container Deployment

**Prerequisites:**
- Docker installed
- Redis instance available

**Run EmailEngine:**

```bash
docker run -d \
  --name emailengine \
  -p 3000:3000 \
  --env EENGINE_REDIS="redis://host.docker.internal:6379/7" \
  --env EENGINE_SECRET="your-secret-key-min-32-chars" \
  --restart unless-stopped \
  postalsys/emailengine:v2
```

**Environment variables:**
- `EENGINE_REDIS` - Redis connection URL
- `EENGINE_SECRET` - Secret for encrypting session tokens (32+ characters)
- `EENGINE_PORT` - HTTP port (default: 3000)

**Access EmailEngine:**
```
http://localhost:3000
```

### Container Management

**View logs:**
```bash
docker logs -f emailengine
```

**Stop container:**
```bash
docker stop emailengine
```

**Start container:**
```bash
docker start emailengine
```

**Restart container:**
```bash
docker restart emailengine
```

**Remove container:**
```bash
docker stop emailengine
docker rm emailengine
```

## Docker Compose Deployment

### Complete Stack with Redis

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
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  emailengine:
    image: postalsys/emailengine:v2
    container_name: emailengine
    depends_on:
      - redis
    ports:
      - "3000:3000"
    environment:
      - EENGINE_REDIS=redis://redis:6379
      - EENGINE_SECRET=${EENGINE_SECRET}
      - EENGINE_WORKERS=4
      - EENGINE_LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  redis-data:
    driver: local

networks:
  default:
    name: emailengine-network
```

### Environment File

Create `.env` file:

```bash
# EmailEngine Configuration
EENGINE_SECRET=your-strong-secret-key-at-least-32-characters-long

# Optional: License key (PEM format - multiline)
EENGINE_PREPARED_LICENSE="-----BEGIN LICENSE-----
Application: EmailEngine
Licensed to: Your Company

your-license-key-data-here...
-----END LICENSE-----"

# Optional: OAuth2 configuration
EENGINE_GMAIL_CLIENT_ID=your-gmail-client-id
EENGINE_GMAIL_CLIENT_SECRET=your-gmail-client-secret

# Optional: Webhook configuration
EENGINE_WEBHOOK_URL=https://your-app.com/webhooks
```

:::warning Security
Never commit `.env` file to version control. Add it to `.gitignore`.
:::

### Start the Stack

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f emailengine

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Volume Mounts

### Persistent Configuration

Mount configuration files:

```yaml
services:
  emailengine:
    # ...
    volumes:
      - ./config:/app/config:ro
      - ./logs:/app/logs
```

**Directory structure:**
```
./config/
  ├── config.json       # Main configuration
  └── prepared-settings/
      └── settings.json
./logs/
  └── emailengine.log
```

### Configuration File Example

`./config/config.json`:

```json
{
  "dbs": {
    "redis": "redis://redis:6379"
  },
  "api": {
    "port": 3000,
    "host": "0.0.0.0"
  },
  "workers": 4,
  "gmail": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret"
  }
}
```

## Advanced Docker Configuration

### Custom Dockerfile

For custom builds with additional dependencies:

```dockerfile
FROM postalsys/emailengine:v2

# Install additional tools
RUN apk add --no-cache \
    curl \
    ca-certificates

# Copy custom configuration
COPY config/ /app/config/

# Set custom environment
ENV NODE_ENV=production
ENV EENGINE_LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use non-root user
USER node

EXPOSE 3000

CMD ["npm", "start"]
```

**Build custom image:**
```bash
docker build -t my-emailengine:latest .
```

### Multi-Stage Build

For optimized production builds:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

USER node
EXPOSE 3000

CMD ["node", "server.js"]
```

## Networking

### Bridge Network (Default)

Default Docker networking:

```yaml
services:
  emailengine:
    ports:
      - "3000:3000"  # Host:Container
```

**Access:**
- From host: `http://localhost:3000`
- From other containers: `http://emailengine:3000`

### Custom Network

Create isolated network:

```yaml
networks:
  emailengine-net:
    driver: bridge

services:
  redis:
    networks:
      - emailengine-net

  emailengine:
    networks:
      - emailengine-net
    ports:
      - "3000:3000"
```

### Host Network Mode

For better performance (Linux only):

```yaml
services:
  emailengine:
    network_mode: "host"
    environment:
      - EENGINE_REDIS=redis://localhost:6379
```

:::warning Host Mode
Host network mode doesn't work on Docker Desktop (Mac/Windows). Use bridge mode instead.
:::

## Security Hardening

### Run as Non-Root User

```dockerfile
# In Dockerfile
USER node

# Or in docker-compose.yml
services:
  emailengine:
    user: "1000:1000"
```

### Read-Only Root Filesystem

```yaml
services:
  emailengine:
    read_only: true
    tmpfs:
      - /tmp
      - /app/.npm
```

### Resource Limits

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

### Secret Management

**Using Docker secrets:**

```yaml
services:
  emailengine:
    secrets:
      - eengine_secret
      - redis_password
    environment:
      - EENGINE_SECRET_FILE=/run/secrets/eengine_secret
      - EENGINE_REDIS=redis://:$(cat /run/secrets/redis_password)@redis:6379

secrets:
  eengine_secret:
    external: true
  redis_password:
    external: true
```

**Create secrets:**
```bash
echo "your-secret-key" | docker secret create eengine_secret -
echo "redis-password" | docker secret create redis_password -
```

## Health Checks

### Container Health Check

```yaml
services:
  emailengine:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**Check health status:**
```bash
docker ps
# Look for "healthy" in STATUS column

# Or detailed health info
docker inspect --format='{{json .State.Health}}' emailengine | jq
```

### Custom Health Check Script

Create `healthcheck.sh`:

```bash
#!/bin/sh
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$response" = "200" ]; then
    exit 0
else
    exit 1
fi
```

**Use in Dockerfile:**
```dockerfile
COPY healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/healthcheck.sh
HEALTHCHECK CMD healthcheck.sh
```

## Updates and Maintenance

### Update to Latest Version

**Docker Compose:**
```bash
# Pull latest images
docker-compose pull

# Recreate containers with new images
docker-compose up -d

# Clean up old images
docker image prune
```

**Single container:**
```bash
# Pull new image
docker pull postalsys/emailengine:v2

# Stop and remove old container
docker stop emailengine
docker rm emailengine

# Start with new image
docker run -d \
  --name emailengine \
  -p 3000:3000 \
  --env EENGINE_REDIS="redis://host.docker.internal:6379/7" \
  postalsys/emailengine:v2
```

### Backup Before Update

```bash
# Backup Redis data
docker exec emailengine-redis redis-cli SAVE
docker cp emailengine-redis:/data/dump.rdb ./backup/

# Or backup volumes
docker run --rm \
  -v emailengine_redis-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/redis-backup.tar.gz -C /data .
```

### Rollback to Previous Version

```bash
# Stop current version
docker-compose down

# Edit docker-compose.yml to use previous version tag
# image: postalsys/emailengine:v2.47.0

# Start with old version
docker-compose up -d
```

## Kubernetes Deployment

### Basic Deployment

`emailengine-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: emailengine
  labels:
    app: emailengine
spec:
  replicas: 3
  selector:
    matchLabels:
      app: emailengine
  template:
    metadata:
      labels:
        app: emailengine
    spec:
      containers:
      - name: emailengine
        image: postalsys/emailengine:v2
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: EENGINE_REDIS
          valueFrom:
            secretKeyRef:
              name: emailengine-secrets
              key: redis-url
        - name: EENGINE_SECRET
          valueFrom:
            secretKeyRef:
              name: emailengine-secrets
              key: secret
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: emailengine
spec:
  selector:
    app: emailengine
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Secrets Management

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: emailengine-secrets
type: Opaque
stringData:
  redis-url: "redis://redis:6379"
  secret: "your-secret-key-at-least-32-characters"
  encryption-secret: "another-secret-for-encryption"
```

**Create from file:**
```bash
kubectl create secret generic emailengine-secrets \
  --from-env-file=.env
```

### Redis StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
spec:
  serviceName: redis
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        volumeMounts:
        - name: redis-data
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: redis-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace emailengine

# Apply configurations
kubectl apply -f emailengine-secrets.yaml -n emailengine
kubectl apply -f redis-statefulset.yaml -n emailengine
kubectl apply -f emailengine-deployment.yaml -n emailengine

# Check status
kubectl get pods -n emailengine
kubectl get services -n emailengine

# View logs
kubectl logs -f deployment/emailengine -n emailengine

# Scale deployment
kubectl scale deployment/emailengine --replicas=5 -n emailengine
```

