---
title: Kubernetes Deployment
description: Deploy EmailEngine on Kubernetes with production configurations
sidebar_position: 2
---

# Kubernetes Deployment

Deploy EmailEngine on Kubernetes for container orchestration and cloud-native deployments.

:::tip Docker Basics
For Docker and Docker Compose setup, see the [Docker Installation Guide](/docs/installation/docker). This page covers Kubernetes-specific deployment.
:::

:::warning Single Instance Only
**EmailEngine does NOT support horizontal scaling.** You must run exactly **one replica** of EmailEngine per Redis database. Multiple instances connecting to the same Redis will cause conflicts, duplicate processing, and data corruption. Scale vertically (more CPU/RAM) instead of horizontally (more replicas).
:::

## Overview

Kubernetes deployment provides:

- **Self-healing** - Automatic pod replacement on failure
- **Rolling updates** - Zero-downtime deployments
- **Service discovery** - Built-in DNS and load balancing
- **Secret management** - Secure credential storage
- **Resource management** - CPU and memory limits

## Prerequisites

- Kubernetes cluster (1.20+)
- `kubectl` configured
- Redis accessible from cluster (or deploy Redis in cluster)

## Basic Deployment

### EmailEngine Deployment

Create `emailengine-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: emailengine
  labels:
    app: emailengine
spec:
  replicas: 1  # IMPORTANT: Do not increase - EmailEngine doesn't support horizontal scaling
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

Create `emailengine-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: emailengine-secrets
type: Opaque
stringData:
  redis-url: "redis://redis:6379/8"
  secret: "your-secret-key-at-least-32-characters"
```

**Create from file:**

```bash
kubectl create secret generic emailengine-secrets \
  --from-env-file=.env
```

### Redis StatefulSet

If running Redis in the cluster:

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
        command: ["redis-server", "--appendonly", "yes", "--maxmemory-policy", "noeviction"]
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
---
apiVersion: v1
kind: Service
metadata:
  name: redis
spec:
  selector:
    app: redis
  ports:
  - port: 6379
  clusterIP: None
```

## Deploy to Kubernetes

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

# Note: Do NOT scale to multiple replicas - EmailEngine doesn't support horizontal scaling
# kubectl scale deployment/emailengine --replicas=1 -n emailengine
```

## Production Configuration

### Resource Tuning

Adjust resources based on account count. Since EmailEngine runs as a single instance, scale **vertically** by increasing CPU and memory:

| Accounts | Memory | CPU | Notes |
|----------|--------|-----|-------|
| < 100 | 1Gi | 500m | Minimum for small deployments |
| 100-1000 | 2Gi | 1 | Typical small business usage |
| 1000-5000 | 4Gi | 2 | Medium deployments |
| 5000+ | 8Gi | 4 | Large deployments, consider dedicated Redis |

:::note Vertical Scaling Only
EmailEngine does not support horizontal scaling. For very large deployments (10,000+ accounts), consider:
- Running multiple EmailEngine instances with **separate Redis databases** (each handling different accounts)
- Using a dedicated high-performance Redis instance
- Optimizing worker count with `EENGINE_WORKERS` environment variable
:::

### Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: emailengine-ingress
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - emailengine.example.com
    secretName: emailengine-tls
  rules:
  - host: emailengine.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: emailengine
            port:
              number: 80
```

### Rolling Update Strategy

Configure rolling updates for zero-downtime deployments:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: emailengine
spec:
  replicas: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
```

This ensures the new pod is running before the old one is terminated.

## Monitoring

### Prometheus ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: emailengine
  labels:
    app: emailengine
spec:
  selector:
    matchLabels:
      app: emailengine
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
    bearerTokenSecret:
      name: emailengine-secrets
      key: metrics-token
```

### Health Check Endpoints

- **Liveness:** `/health` - Returns 200 if running
- **Readiness:** `/health` - Returns 200 if ready to accept traffic

## Troubleshooting

### Check Pod Status

```bash
# Get pod status
kubectl get pods -n emailengine

# Describe pod for events
kubectl describe pod <pod-name> -n emailengine

# Get logs
kubectl logs <pod-name> -n emailengine
kubectl logs <pod-name> -n emailengine --previous  # Previous container
```

### Common Issues

**Pods not starting:**
- Check secrets are created: `kubectl get secrets -n emailengine`
- Verify Redis connectivity from pod
- Check resource limits

**Redis connection errors:**
- Verify Redis service is running
- Check Redis URL in secret
- Test connectivity: `kubectl exec -it <pod> -- nc -zv redis 6379`

**High memory usage:**
- Increase memory limits
- Check account count vs resources
- Review worker configuration

## See Also

- [Docker Installation](/docs/installation/docker) - Docker and Docker Compose setup
- [Performance Tuning](/docs/advanced/performance-tuning) - Optimize for large deployments
- [Monitoring](/docs/advanced/monitoring) - Set up Prometheus and Grafana
