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
  "success": true
}
```

The health check verifies:
- All IMAP workers are available
- Redis database is accessible and responding

### Detailed Status Check

Get more detailed status information:

```bash
curl http://localhost:3000/v1/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response includes:

```json
{
  "version": "2.58.0",
  "license": "MIT",
  "accounts": 15,
  "node": "24.0.0",
  "redis": "7.2.4",
  "counters": {
    "events:messageNew": 1523,
    "webhooks:messageNew": 1450,
    "apiReq:GET /v1/stats": 234
  },
  "queues": {
    "notify": {
      "active": 2,
      "delayed": 0,
      "waiting": 0,
      "paused": 0,
      "isPaused": false,
      "total": 2
    },
    "submit": {
      "active": 1,
      "delayed": 0,
      "waiting": 5,
      "paused": 0,
      "isPaused": false,
      "total": 6
    },
    "documents": {
      "active": 0,
      "delayed": 0,
      "waiting": 0,
      "paused": 0,
      "isPaused": false,
      "total": 0
    }
  },
  "connections": {
    "connected": 14,
    "connecting": 1
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

#### Connection Metrics

```
# IMAP connections by status
imap_connections{status="connected"}
imap_connections{status="connecting"}
imap_connections{status="authenticationError"}
imap_connections{status="connectError"}
imap_connections{status="syncing"}
imap_connections{status="disconnected"}

# IMAP responses
imap_responses{response="OK"}
imap_responses{response="OK",code="CAPABILITY"}

# IMAP traffic
imap_bytes_sent
imap_bytes_received
```

#### Webhook and Event Metrics

```
# Webhooks sent by event and status
webhooks{event="messageNew",status="success"}
webhooks{event="messageUpdated",status="success"}
webhooks{event="messageDeleted",status="success"}

# Events fired
events{event="messageNew"}
events{event="messageUpdated"}

# Webhook request duration (buckets in milliseconds)
webhook_req_bucket{le="100"}
webhook_req_bucket{le="1000"}
webhook_req_bucket{le="10000"}
webhook_req_sum
webhook_req_count
```

#### Queue Metrics

```
# Queue sizes by state
queue_size{queue="notify",state="waiting"}
queue_size{queue="submit",state="active"}
queue_size{queue="documents",state="delayed"}

# Processed job counts
queues_processed{queue="notify"}
queues_processed{queue="submit"}
```

#### API Metrics

```
# API calls by method and status
api_call{method="post",route="/v1/account/:account/submit",statusCode="200"}
api_call{method="get",route="/v1/account/:account",statusCode="200"}
```

#### System Metrics

```
# Worker threads
threads{type="imap"}
threads{type="webhooks"}

# Configuration
emailengine_config{version="v2.58.0"}
emailengine_config{config="workersImap"}
```

Note: Memory usage, CPU usage, and uptime metrics are available through standard Node.js metrics exporters if needed.

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

**Panel 1: IMAP Connection Status**

```promql
# Query
sum by (status) (imap_connections)

# Visualization: Pie Chart
# Legend: {{status}}
```

**Panel 2: Webhook Events Rate**

```promql
# Query
rate(webhooks[5m]) * 60

# Visualization: Graph
# Label: Webhooks per minute
```

**Panel 3: Webhook Success vs Failure**

```promql
# Queries (use multiple series)
sum(rate(webhooks{status="success"}[5m])) * 60
sum(rate(webhooks{status="failure"}[5m])) * 60

# Visualization: Graph
# Labels: Success, Failure
```

**Panel 4: Queue Health**

```promql
# Queries (multiple series)
queue_size{queue="notify",state="waiting"}
queue_size{queue="submit",state="waiting"}

# Visualization: Stat or Graph
# Alert if > 100
```

**Panel 5: IMAP Connections by Status**

```promql
# Query
imap_connections{status="connected"}
imap_connections{status="authenticationError"}
imap_connections{status="connectError"}

# Visualization: Graph (stacked)
# Legend: {{status}}
```

**Panel 6: Webhook Response Time**

```promql
# Query (99th percentile, result in milliseconds)
histogram_quantile(0.99,
  rate(webhook_req_bucket[5m])
)

# Visualization: Graph
# Label: 99th percentile webhook duration (ms)
```

### Dashboard Variables

Add variables for filtering:

```
$environment = label_values(imap_connections, environment)
$instance = label_values(imap_connections, instance)
```

## Key Metrics to Monitor

### Critical Metrics

Monitor these metrics closely in production:

#### 1. Account Connection Health

```promql
# Connected accounts
imap_connections{status="connected"}

# Disconnected or errored accounts
imap_connections{status="authenticationError"}
imap_connections{status="connectError"}
imap_connections{status="disconnected"}

# Alert if too many disconnected
```

#### 2. Webhook Queue Size

```promql
# Alert if queue is backing up
queue_size{queue="notify",state="waiting"} > 100
```

#### 3. Webhook Failure Rate

```promql
# Alert if failure rate > 5%
(sum(rate(webhooks{status="failure"}[5m])) /
 sum(rate(webhooks[5m]))) * 100 > 5
```

#### 4. Webhook Processing Time

```promql
# Alert if webhooks are processing slowly (99th percentile > 5 seconds)
# Note: webhook_req buckets are in milliseconds
histogram_quantile(0.99,
  rate(webhook_req_bucket[5m])
) > 5000
```

#### 5. Queue Processing Rate

```promql
# Monitor queue processing rate
rate(queues_processed{queue="notify"}[5m])
rate(queues_processed{queue="submit"}[5m])
```

### Performance Indicators

Track these for performance optimization:

```promql
# Webhook events per minute
rate(webhooks[5m]) * 60

# Webhook processing time (median, in milliseconds)
histogram_quantile(0.5,
  rate(webhook_req_bucket[5m])
)

# Queue throughput
rate(queues_processed[5m])

# Active queue jobs
queue_size{state="active"}

# API call rate by endpoint
rate(api_call[5m])
```

## Alerting Setup

### Prometheus Alertmanager

Configure alerts in `prometheus_rules.yml`:

```yaml
groups:
  - name: emailengine
    interval: 30s
    rules:
      # IMAP connection errors
      - alert: EmailEngineConnectionErrors
        expr: |
          imap_connections{status=~"authenticationError|connectError"} > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Multiple IMAP connection errors"
          description: "{{ $value }} accounts with {{ $labels.status }}"

      # Webhook queue backing up
      - alert: EmailEngineWebhookQueueHigh
        expr: queue_size{queue="notify",state="waiting"} > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Webhook queue is backing up"
          description: "{{ $value }} webhooks waiting in queue"

      # High webhook failure rate
      - alert: EmailEngineWebhookFailureRate
        expr: |
          (sum(rate(webhooks{status="failure"}[5m])) /
           sum(rate(webhooks[5m]))) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High webhook failure rate"
          description: "{{ $value | humanizePercentage }} webhooks failing"

      # EmailEngine down
      - alert: EmailEngineDown
        expr: up{job="emailengine"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "EmailEngine is down"
          description: "EmailEngine on {{ $labels.instance }} is down"

      # Slow webhook processing (buckets are in milliseconds)
      - alert: EmailEngineSlowWebhooks
        expr: |
          histogram_quantile(0.99, rate(webhook_req_bucket[5m])) > 10000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Webhooks processing slowly"
          description: "99th percentile webhook duration: {{ $value }}ms"

      # Queue not processing
      - alert: EmailEngineQueueStalled
        expr: |
          rate(queues_processed[5m]) == 0 and queue_size{state="waiting"} > 0
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Queue processing stalled"
          description: "Queue {{ $labels.queue }} has jobs but no processing"
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

Bull Board is always enabled and available at:

```
http://localhost:3000/admin/bull-board
```

You can also access it from the dashboard sidebar under **Tools** → **Bull Board**.

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
queue_size{state="waiting"} > 0

# Good - meaningful threshold
queue_size{state="waiting"} > 100 for 5m
```

### 2. Monitor Trends, Not Just Absolutes

```promql
# Track rate of change for webhooks
rate(webhooks{status="failure"}[30m])
```

### 3. Create Composite Alerts

```promql
# Alert only if multiple conditions met
(queue_size{queue="notify",state="waiting"} > 100) AND
(sum(rate(webhooks{status="failure"}[5m])) > 0.1)
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

TOKEN="$1"
HOST="${2:-localhost:3000}"

# Check basic health endpoint (no auth required)
HEALTH=$(curl -s http://$HOST/health)
SUCCESS=$(echo $HEALTH | jq -r '.success')

if [ "$SUCCESS" != "true" ]; then
  echo "CRITICAL: EmailEngine health check failed"
  exit 2
fi

# Get detailed stats (requires token)
STATS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://$HOST/v1/stats")

# Check connected accounts
CONNECTED=$(echo $STATS | jq -r '.connections.connected // 0')
TOTAL=$(echo $STATS | jq -r '.accounts')

if [ "$TOTAL" -gt 0 ]; then
  PERCENT=$(echo "scale=2; $CONNECTED * 100 / $TOTAL" | bc)
  if (( $(echo "$PERCENT < 95" | bc -l) )); then
    echo "WARNING: Only $PERCENT% accounts connected ($CONNECTED/$TOTAL)"
    exit 1
  fi
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
  "http://$HOST/v1/stats")

# Check webhook queue (notify queue handles webhooks)
QUEUE_WAITING=$(echo $STATS | jq -r '.queues.notify.waiting // 0')
QUEUE_TOTAL=$(echo $STATS | jq -r '.queues.notify.total // 0')
if [ "$QUEUE_WAITING" -gt 100 ]; then
  echo "CRITICAL: Webhook queue size $QUEUE_WAITING | queue=$QUEUE_WAITING"
  exit 2
fi

# Check queue status
QUEUE_PAUSED=$(echo $STATS | jq -r '.queues.notify.isPaused')
if [ "$QUEUE_PAUSED" = "true" ]; then
  echo "WARNING: Webhook queue is paused | paused=1"
  exit 1
fi

echo "OK: EmailEngine operational | queue_waiting=$QUEUE_WAITING queue_total=$QUEUE_TOTAL"
exit 0
```

