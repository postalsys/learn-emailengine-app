---
title: Monitoring and Observability
sidebar_position: 5
description: Monitor EmailEngine with health checks, Prometheus metrics, Grafana dashboards, and alerting for production deployments
keywords:
  - monitoring
  - prometheus
  - grafana
  - metrics
  - health checks
  - observability
  - alerting
---

<!--
SOURCE: docs/configuration/monitoring.md
This guide covers monitoring EmailEngine in production with health checks, metrics, and alerting.
-->

# Monitoring and Observability

Monitor EmailEngine health, performance, and activity with built-in health check endpoints, Prometheus metrics, and integrations with popular observability platforms.

## Overview

EmailEngine provides comprehensive monitoring capabilities:

- **Health Check Endpoints** - Simple HTTP endpoints for uptime monitoring
- **Prometheus Metrics** - Detailed metrics for Prometheus/Grafana stack
- **Performance Indicators** - Track message processing, connections, and queue health
- **Custom Alerting** - Set up alerts based on key metrics
- **Bull Board Dashboard** - Visual queue monitoring (see [Webhooks Guide](/docs/receiving/webhooks))

## Health Check Endpoints

### Basic Health Check

Use the `/health` endpoint to verify EmailEngine is running:

```bash
curl http://localhost:3000/health
```

Response when healthy:

```json
{
  "status": "ok",
  "version": "2.41.5",
  "license": "valid",
  "accounts": {
    "total": 15,
    "connected": 14,
    "disconnected": 1
  },
  "redis": {
    "status": "connected"
  }
}
```

### Detailed Status Check

Get more detailed status information:

```bash
curl http://localhost:3000/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response includes:

```json
{
  "version": "2.41.5",
  "accounts": 15,
  "counters": {
    "events": 1523,
    "webhooks": 1450,
    "emails": 8234
  },
  "queues": {
    "webhook": {
      "waiting": 0,
      "active": 2,
      "completed": 1450,
      "failed": 3
    },
    "submit": {
      "waiting": 5,
      "active": 1,
      "completed": 234
    }
  }
}
```

## Prometheus Metrics

### Setting Up Prometheus

EmailEngine exposes Prometheus metrics at `/metrics` endpoint.

#### Step 1: Create Metrics Token

1. Navigate to **Settings** → **Access Tokens** in EmailEngine UI
2. Click **Create new**
3. Uncheck **All scopes**
4. Check only **Metrics** scope
5. Create token and save it

#### Step 2: Configure Prometheus

Add EmailEngine as a scraping target in `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'emailengine'
    scrape_interval: 10s
    metrics_path: '/metrics'
    scheme: 'http'
    authorization:
      type: Bearer
      credentials: 795f623527c16d617b106...  # Your metrics token
    static_configs:
      - targets: ['127.0.0.1:3000']
```

For multiple EmailEngine instances:

```yaml
scrape_configs:
  - job_name: 'emailengine'
    scrape_interval: 10s
    metrics_path: '/metrics'
    scheme: 'https'
    authorization:
      type: Bearer
      credentials: YOUR_METRICS_TOKEN
    static_configs:
      - targets:
        - 'ee-prod-01.example.com:3000'
        - 'ee-prod-02.example.com:3000'
        - 'ee-prod-03.example.com:3000'
        labels:
          environment: 'production'
```

#### Step 3: Restart Prometheus

```bash
# SystemD
sudo systemctl restart prometheus

# Docker
docker restart prometheus
```

#### Step 4: Verify

Check Prometheus targets page:

```
http://localhost:9090/targets
```

EmailEngine should appear with status `UP`.

### Available Metrics

EmailEngine exposes these Prometheus metrics:

#### Account Metrics

```
# Total accounts registered
emailengine_accounts_total

# Accounts by connection state
emailengine_accounts_state{state="connected"}
emailengine_accounts_state{state="connecting"}
emailengine_accounts_state{state="authenticationError"}
emailengine_accounts_state{state="connectError"}

# Accounts by provider
emailengine_accounts_by_type{type="imap"}
emailengine_accounts_by_type{type="gmail"}
emailengine_accounts_by_type{type="outlook"}
```

#### Message Processing Metrics

```
# New messages received (counter)
emailengine_messages_new_total

# Messages sent (counter)
emailengine_messages_sent_total

# Webhook deliveries (counter)
emailengine_webhook_calls_total

# Failed webhook deliveries (counter)
emailengine_webhook_failures_total

# Message processing duration (histogram)
emailengine_message_processing_duration_seconds
```

#### Queue Metrics

```
# Jobs waiting in queue
emailengine_queue_waiting{queue="webhook"}
emailengine_queue_waiting{queue="submit"}
emailengine_queue_waiting{queue="documents"}

# Active jobs
emailengine_queue_active{queue="webhook"}

# Completed jobs
emailengine_queue_completed_total{queue="webhook"}

# Failed jobs
emailengine_queue_failed_total{queue="webhook"}

# Queue processing duration
emailengine_queue_duration_seconds{queue="webhook"}
```

#### Connection Metrics

```
# Active IMAP connections
emailengine_imap_connections_active

# IMAP connection errors (counter)
emailengine_imap_errors_total{type="timeout"}
emailengine_imap_errors_total{type="authentication"}

# Average connection duration
emailengine_imap_connection_duration_seconds
```

#### System Metrics

```
# Redis connection status
emailengine_redis_connected

# Memory usage (bytes)
emailengine_memory_usage_bytes

# CPU usage (percent)
emailengine_cpu_usage_percent

# Uptime (seconds)
emailengine_uptime_seconds
```

## Grafana Dashboard

### Setting Up Grafana

Create a comprehensive EmailEngine dashboard in Grafana.

#### Add Prometheus Data Source

1. Go to **Configuration** → **Data Sources**
2. Add Prometheus
3. URL: `http://localhost:9090`
4. Save & Test

#### Create Dashboard

Import this dashboard JSON or create panels manually:

**Panel 1: Account Status Overview**

```promql
# Query
sum by (state) (emailengine_accounts_state)

# Visualization: Pie Chart
# Legend: {{state}}
```

**Panel 2: Message Processing Rate**

```promql
# Query
rate(emailengine_messages_new_total[5m]) * 60

# Visualization: Graph
# Label: Messages per minute
```

**Panel 3: Webhook Success Rate**

```promql
# Query
rate(emailengine_webhook_calls_total[5m]) -
rate(emailengine_webhook_failures_total[5m])

# Visualization: Graph
# Label: Successful webhooks/sec
```

**Panel 4: Queue Health**

```promql
# Query
emailengine_queue_waiting{queue="webhook"}

# Visualization: Stat
# Alert if > 100
```

**Panel 5: Connection Errors**

```promql
# Query
rate(emailengine_imap_errors_total[5m]) * 60

# Visualization: Graph (stacked)
# Legend: {{type}}
```

**Panel 6: Response Time**

```promql
# Query (99th percentile)
histogram_quantile(0.99,
  rate(emailengine_message_processing_duration_seconds_bucket[5m])
)

# Visualization: Graph
# Label: 99th percentile response time
```

### Dashboard Variables

Add variables for filtering:

```
$environment = label_values(emailengine_accounts_total, environment)
$instance = label_values(emailengine_accounts_total, instance)
```

## Key Metrics to Monitor

### Critical Metrics

Monitor these metrics closely in production:

#### 1. Account Connection Health

```promql
# Percentage of connected accounts
(emailengine_accounts_state{state="connected"} /
 emailengine_accounts_total) * 100

# Alert if < 95%
```

#### 2. Webhook Queue Size

```promql
# Alert if queue is backing up
emailengine_queue_waiting{queue="webhook"} > 100
```

#### 3. Webhook Failure Rate

```promql
# Alert if failure rate > 5%
(rate(emailengine_webhook_failures_total[5m]) /
 rate(emailengine_webhook_calls_total[5m])) * 100 > 5
```

#### 4. Message Processing Lag

```promql
# Alert if messages are processing slowly
histogram_quantile(0.99,
  rate(emailengine_message_processing_duration_seconds_bucket[5m])
) > 5
```

#### 5. IMAP Connection Errors

```promql
# Alert if error rate increasing
rate(emailengine_imap_errors_total[5m]) * 60 > 10
```

### Performance Indicators

Track these for performance optimization:

```promql
# Average messages processed per minute
rate(emailengine_messages_new_total[5m]) * 60

# Webhook processing time (median)
histogram_quantile(0.5,
  rate(emailengine_queue_duration_seconds_bucket{queue="webhook"}[5m])
)

# Memory growth rate
deriv(emailengine_memory_usage_bytes[30m])

# Connection pool utilization
emailengine_imap_connections_active / emailengine_accounts_total
```

## Alerting Setup

### Prometheus Alertmanager

Configure alerts in `prometheus_rules.yml`:

```yaml
groups:
  - name: emailengine
    interval: 30s
    rules:
      # Account connection health
      - alert: EmailEngineAccountsDisconnected
        expr: |
          (emailengine_accounts_state{state="connected"} /
           emailengine_accounts_total) < 0.95
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Less than 95% accounts connected"
          description: "Only {{ $value }}% of accounts connected"

      # Webhook queue backing up
      - alert: EmailEngineWebhookQueueHigh
        expr: emailengine_queue_waiting{queue="webhook"} > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Webhook queue is backing up"
          description: "{{ $value }} webhooks waiting"

      # High webhook failure rate
      - alert: EmailEngineWebhookFailureRate
        expr: |
          (rate(emailengine_webhook_failures_total[5m]) /
           rate(emailengine_webhook_calls_total[5m])) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High webhook failure rate"
          description: "{{ $value | humanizePercentage }} failing"

      # EmailEngine down
      - alert: EmailEngineDown
        expr: up{job="emailengine"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "EmailEngine is down"
          description: "EmailEngine on {{ $labels.instance }} is down"

      # Memory usage high
      - alert: EmailEngineHighMemory
        expr: emailengine_memory_usage_bytes > 2147483648  # 2GB
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "EmailEngine using high memory"
          description: "{{ $value | humanize }}B used"

      # Redis connection lost
      - alert: EmailEngineRedisDisconnected
        expr: emailengine_redis_connected == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "EmailEngine lost Redis connection"
```

### Alertmanager Configuration

Configure notification channels in `alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'instance']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'email-notifications'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'

receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'ops@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alerts'
        auth_password: 'secret'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'

  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK'
        channel: '#emailengine-alerts'
        title: 'EmailEngine Alert'
```

## Integration with Observability Platforms

### Datadog

Monitor EmailEngine with Datadog APM:

```
// Pseudo code - implement in your preferred language

// Initialize Datadog tracer
DATADOG_INIT({
  service: 'emailengine',
  env: ENV['NODE_ENV'],
  version: APP_VERSION
})

// Initialize StatsD client
statsd = STATSD_CLIENT({
  host: 'datadog-agent',
  port: 8125,
  prefix: 'emailengine.'
})

// Track custom events
statsd.INCREMENT('accounts.connected')
statsd.GAUGE('queue.size', queue_size)
statsd.TIMING('webhook.duration', duration)
```

### New Relic

Monitor with New Relic APM:

```bash
# Install agent
npm install newrelic

# Configure newrelic.js
# Start with agent
node -r newrelic server.js
```

### Elastic APM

Monitor with Elasticsearch APM by initializing the APM agent with your language's elastic-apm library, providing service name, server URL, and environment configuration.

## Bull Board Dashboard

EmailEngine uses Bull queues. Monitor them visually with Bull Board.

Enable in EmailEngine UI:

1. Go to **Settings** → **Configuration**
2. Enable **Bull Board**
3. Access at `http://localhost:3000/admin/arena`

See detailed queue monitoring in [Webhooks Guide - Debugging Section](/docs/receiving/webhooks#debugging-webhooks).

## Log-Based Monitoring

### Structured Logging

EmailEngine logs in JSON format (Pino). Parse logs for monitoring:

```bash
# Count errors per hour
cat emailengine.log | \
  grep '"level":50' | \
  jq -r '.time' | \
  cut -c1-13 | \
  uniq -c

# Track webhook failures
cat emailengine.log | \
  grep 'webhook.*failed' | \
  jq -r '{time: .time, account: .account, error: .err.message}'
```

### ELK Stack Integration

Ship logs to Elasticsearch:

**Filebeat configuration:**

```yaml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/emailengine/*.log
    json.keys_under_root: true
    json.add_error_key: true
    fields:
      service: emailengine
      environment: production

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "emailengine-%{+yyyy.MM.dd}"
```

**Kibana Dashboard Queries:**

```
# Error rate over time
level:50 AND service:emailengine

# Webhook failures
msg:"webhook failed" AND service:emailengine

# Account connection issues
msg:"connection error" AND service:emailengine
```

### Grafana Loki

Ship logs to Loki with Promtail:

```yaml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: emailengine
    static_configs:
      - targets:
          - localhost
        labels:
          job: emailengine
          __path__: /var/log/emailengine/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            message: msg
            account: account
      - labels:
          level:
          account:
```

## Monitoring Best Practices

### 1. Set Appropriate Thresholds

Don't alert on noise:

```promql
# Bad - too sensitive
emailengine_queue_waiting > 0

# Good - meaningful threshold
emailengine_queue_waiting > 100 for 5m
```

### 2. Monitor Trends, Not Just Absolutes

```promql
# Track rate of change
deriv(emailengine_webhook_failures_total[30m]) > 10
```

### 3. Create Composite Alerts

```promql
# Alert only if multiple conditions met
(emailengine_queue_waiting{queue="webhook"} > 100) AND
(rate(emailengine_webhook_failures_total[5m]) > 0.1)
```

### 4. Use Alert Grouping

Group related alerts to avoid alarm fatigue:

```yaml
route:
  group_by: ['alertname', 'instance']
  group_wait: 30s
  group_interval: 5m
```

### 5. Document Runbooks

Include runbook links in alert annotations:

```yaml
annotations:
  summary: "Webhook queue backing up"
  description: "{{ $value }} webhooks waiting"
  runbook: "https://wiki.example.com/emailengine/webhook-queue-backup"
```

## Health Check Scripts

### Simple Uptime Check

```bash
#!/bin/bash
# check-emailengine-health.sh

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

if [ "$RESPONSE" != "200" ]; then
  echo "EmailEngine health check failed: HTTP $RESPONSE"
  exit 1
fi

echo "EmailEngine is healthy"
exit 0
```

### Comprehensive Check

```bash
#!/bin/bash
# comprehensive-health-check.sh

# Check health endpoint
HEALTH=$(curl -s http://localhost:3000/health)
STATUS=$(echo $HEALTH | jq -r '.status')

if [ "$STATUS" != "ok" ]; then
  echo "CRITICAL: EmailEngine status is $STATUS"
  exit 2
fi

# Check connected accounts
CONNECTED=$(echo $HEALTH | jq -r '.accounts.connected')
TOTAL=$(echo $HEALTH | jq -r '.accounts.total')
PERCENT=$(echo "scale=2; $CONNECTED * 100 / $TOTAL" | bc)

if (( $(echo "$PERCENT < 95" | bc -l) )); then
  echo "WARNING: Only $PERCENT% accounts connected"
  exit 1
fi

# Check Redis
REDIS=$(echo $HEALTH | jq -r '.redis.status')
if [ "$REDIS" != "connected" ]; then
  echo "CRITICAL: Redis not connected"
  exit 2
fi

echo "OK: EmailEngine healthy - $CONNECTED/$TOTAL accounts connected"
exit 0
```

### Nagios/Icinga Plugin

```bash
#!/bin/bash
# check_emailengine

TOKEN="$1"
HOST="${2:-localhost:3000}"

STATS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://$HOST/admin/stats")

# Check webhook queue
QUEUE_SIZE=$(echo $STATS | jq -r '.queues.webhook.waiting')
if [ "$QUEUE_SIZE" -gt 100 ]; then
  echo "CRITICAL: Webhook queue size $QUEUE_SIZE | queue=$QUEUE_SIZE"
  exit 2
fi

# Check failed webhooks
FAILED=$(echo $STATS | jq -r '.queues.webhook.failed')
if [ "$FAILED" -gt 10 ]; then
  echo "WARNING: $FAILED failed webhooks | failed=$FAILED"
  exit 1
fi

echo "OK: EmailEngine operational | queue=$QUEUE_SIZE failed=$FAILED"
exit 0
```

## Troubleshooting Monitoring Issues

### Prometheus Not Scraping

**Check Prometheus is configured correctly:**

```bash
# View Prometheus configuration
curl localhost:9090/api/v1/status/config | jq '.data.yaml'

# Check targets status
curl localhost:9090/api/v1/targets | jq '.data.activeTargets'
```

**Common issues:**

1. **Invalid bearer token** - Regenerate metrics token
2. **Wrong URL** - Verify EmailEngine URL is reachable from Prometheus
3. **Firewall blocking** - Check network connectivity
4. **SSL/TLS issues** - Use `insecure_skip_verify: true` for testing

### Metrics Not Appearing

**Check metrics endpoint directly:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/metrics
```

Should return Prometheus format:

```
# HELP emailengine_accounts_total Total number of accounts
# TYPE emailengine_accounts_total gauge
emailengine_accounts_total 15

# HELP emailengine_messages_new_total Total new messages
# TYPE emailengine_messages_new_total counter
emailengine_messages_new_total 8234
```

**If empty:**

1. Verify token has "Metrics" scope
2. Check EmailEngine version (metrics added in v2.30+)
3. Enable metrics in configuration

### Grafana Dashboard Not Loading

**Check Prometheus data source:**

```bash
# Test Prometheus connection
curl http://prometheus:9090/api/v1/query?query=up
```

**Check PromQL queries:**

```bash
# Test query directly
curl 'http://prometheus:9090/api/v1/query?query=emailengine_accounts_total'
```

**Common issues:**

1. Wrong Prometheus URL in data source
2. Query syntax errors
3. No data for time range selected
4. Dashboard variable not set

### Alerts Not Firing

**Check alert rules:**

```bash
# View active alerts
curl http://prometheus:9090/api/v1/alerts | jq
```

**Verify alert condition:**

```bash
# Test alert query
curl 'http://prometheus:9090/api/v1/query?query=emailengine_queue_waiting{queue="webhook"}'
```

**Check Alertmanager:**

```bash
# View Alertmanager status
curl http://alertmanager:9093/api/v1/status

# Check alert routing
curl http://alertmanager:9093/api/v1/receivers
```
