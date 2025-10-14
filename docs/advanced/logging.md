---
title: Logging
sidebar_position: 4
description: Configure EmailEngine logging with Pino, log levels, rotation, and integration with ELK Stack, Grafana Loki, and other log aggregation platforms
keywords:
  - logging
  - pino
  - log levels
  - log rotation
  - elk stack
  - loki
  - log aggregation
---

<!--
SOURCE: docs/configuration/logging.md
This guide covers EmailEngine logging configuration, formats, and integration with log management platforms.
-->

# Logging

EmailEngine provides comprehensive structured logging using the Pino logging framework. Learn how to configure logging levels, formats, and integrate with log aggregation platforms.

## Overview

EmailEngine logging features:

- **Structured JSON Logs** - Machine-readable JSON format via [Pino](https://github.com/pinojs/pino)
- **Configurable Log Levels** - Control verbosity from trace to fatal
- **Log Formatting** - Pretty-print for development, JSON for production
- **Log Rotation** - Automatic log file rotation and compression
- **Integration Ready** - Works with ELK Stack, Loki, Datadog, and more

## Log Output

By default, EmailEngine logs all messages to **standard output** (stdout) in Pino JSON format.

### JSON Log Format

Default log output:

```json
{"level":30,"time":1697123456789,"pid":12345,"hostname":"server-01","account":"john@example.com","msg":"Account connected"}
{"level":30,"time":1697123457123,"pid":12345,"hostname":"server-01","msg":"Processing new message","messageId":"<abc@example.com>"}
{"level":50,"time":1697123458456,"pid":12345,"hostname":"server-01","err":{"type":"Error","message":"Connection timeout"},"msg":"IMAP connection failed"}
```

### Pino Log Levels

EmailEngine uses standard Pino log levels:

| Level | Value | Description | Use Case |
|-------|-------|-------------|----------|
| `fatal` | 60 | Application crash | Unrecoverable errors |
| `error` | 50 | Error conditions | Failed operations, connection errors |
| `warn` | 40 | Warning conditions | Deprecated features, potential issues |
| `info` | 30 | Informational | Normal operations, state changes |
| `debug` | 20 | Debug information | Detailed operation logs |
| `trace` | 10 | Trace information | Very detailed debugging |

## Configuration

### Setting Log Level

Control log verbosity with the `EENGINE_LOG_LEVEL` environment variable:

```bash
# Production - info level (default)
EENGINE_LOG_LEVEL=info node server.js

# Development - debug level
EENGINE_LOG_LEVEL=debug node server.js

# Troubleshooting - trace level (very verbose)
EENGINE_LOG_LEVEL=trace node server.js

# Quiet mode - errors only
EENGINE_LOG_LEVEL=error node server.js
```

**Recommended log levels:**

- **Production:** `info` (default) - Normal operations only
- **Staging:** `debug` - Include debugging information
- **Development:** `trace` - Full detail for troubleshooting
- **Error monitoring:** `error` - Errors only for alerting

### Pretty Printing

For human-readable logs during development, pipe through `pino-pretty`:

```bash
# Install pino-pretty
npm install -g pino-pretty

# Run with pretty logs
node server.js | pino-pretty

# Or with color
node server.js | pino-pretty --colorize

# With timestamps
node server.js | pino-pretty --translateTime "yyyy-mm-dd HH:MM:ss"
```

Pretty output example:

```
[2024-10-13 14:23:45] INFO (12345 on server-01): Account connected
    account: "john@example.com"
[2024-10-13 14:23:46] INFO (12345 on server-01): Processing new message
    messageId: "<abc@example.com>"
[2024-10-13 14:23:47] ERROR (12345 on server-01): IMAP connection failed
    err: {
      "type": "Error",
      "message": "Connection timeout"
    }
```

### Custom Formatting

Create custom Pino transports for specific formatting:

**pino-transport.js:**

```javascript
const build = require('pino-abstract-transport');

module.exports = async function (opts) {
  return build(async function (source) {
    for await (const obj of source) {
      // Custom formatting
      const line = `[${new Date(obj.time).toISOString()}] ${obj.level}: ${obj.msg}`;
      console.log(line);
    }
  });
};
```

Use custom transport:

```bash
node server.js | pino-transport
```

## Log Rotation

### Using PM2

PM2 automatically handles log rotation:

**ecosystem.config.js:**

```javascript
module.exports = {
  apps: [{
    name: 'emailengine',
    script: './server.js',
    instances: 1,

    // Log configuration
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Log rotation
    max_memory_restart: '1G',
    log_type: 'json'
  }]
};
```

Configure PM2 log rotation:

```bash
# Install rotation module
pm2 install pm2-logrotate

# Configure rotation (daily, keep 7 days)
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

### Using Logrotate

For SystemD deployments, use `logrotate`:

**/etc/logrotate.d/emailengine:**

```
/var/log/emailengine/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 emailengine emailengine
    sharedscripts
    postrotate
        # Reload EmailEngine to reopen log files
        systemctl reload emailengine > /dev/null 2>&1 || true
    endscript
}
```

Test configuration:

```bash
# Test logrotate config
sudo logrotate -d /etc/logrotate.d/emailengine

# Force rotation (for testing)
sudo logrotate -f /etc/logrotate.d/emailengine
```

### Using Docker Volumes

For Docker deployments, mount logs as volumes:

**docker-compose.yml:**

```yaml
version: '3.8'
services:
  emailengine:
    image: postalsys/emailengine:latest
    volumes:
      - ./logs:/app/logs
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Docker handles rotation automatically with these settings.

## Log Aggregation

### ELK Stack (Elasticsearch, Logstash, Kibana)

#### Option 1: Filebeat

Ship logs to Elasticsearch with Filebeat:

**filebeat.yml:**

```yaml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/emailengine/*.log

    # Parse JSON logs
    json.keys_under_root: true
    json.add_error_key: true
    json.overwrite_keys: true

    # Add metadata
    fields:
      service: emailengine
      environment: production
      datacenter: us-east-1
    fields_under_root: true

processors:
  # Add host metadata
  - add_host_metadata:
      when.not.contains.tags: forwarded

  # Extract account info
  - rename:
      fields:
        - from: "account"
          to: "email.account"
      ignore_missing: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "emailengine-%{+yyyy.MM.dd}"

  # Optional authentication
  username: "elastic"
  password: "changeme"

# Optional: Send to Logstash instead
# output.logstash:
#   hosts: ["logstash:5044"]
```

Start Filebeat:

```bash
sudo systemctl start filebeat
sudo systemctl enable filebeat
```

#### Option 2: Docker Logging Driver

For Docker deployments, use the Elasticsearch logging driver:

**docker-compose.yml:**

```yaml
version: '3.8'
services:
  emailengine:
    image: postalsys/emailengine:latest
    logging:
      driver: "fluentd"
      options:
        fluentd-address: localhost:24224
        tag: emailengine
```

#### Kibana Dashboards

Create visualizations in Kibana:

**Useful queries:**

```
# All errors
level:50 AND service:emailengine

# Webhook failures
msg:"webhook failed" AND service:emailengine

# Account connection issues
msg:*connection* AND level:>=40

# Slow operations
duration:>5000 AND service:emailengine

# Specific account
account:"john@example.com"
```

**Sample dashboard panels:**

1. **Error Rate Over Time** - Line chart of `level:50` count
2. **Top Errors** - Pie chart of `err.message` aggregation
3. **Accounts with Issues** - Table of accounts with errors
4. **Log Level Distribution** - Pie chart of log level counts
5. **Recent Errors** - Table of recent error logs

### Grafana Loki

Ship logs to Grafana Loki with Promtail:

**promtail-config.yml:**

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

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
          environment: production
          __path__: /var/log/emailengine/*.log

    # Parse JSON logs
    pipeline_stages:
      - json:
          expressions:
            level: level
            message: msg
            account: account
            timestamp: time
            error: err

      # Extract log level name
      - template:
          source: level_name
          template: '{{ if eq .level "60" }}fatal{{ else if eq .level "50" }}error{{ else if eq .level "40" }}warn{{ else if eq .level "30" }}info{{ else if eq .level "20" }}debug{{ else }}trace{{ end }}'

      # Set labels
      - labels:
          level_name:
          account:

      # Use custom timestamp
      - timestamp:
          source: timestamp
          format: Unix

      # Output message
      - output:
          source: message
```

Start Promtail:

```bash
promtail -config.file=promtail-config.yml
```

**Query logs in Grafana:**

```logql
# All logs
{job="emailengine"}

# Filter by level
{job="emailengine"} |= "level" | json | level="50"

# Filter by account
{job="emailengine"} | json | account="john@example.com"

# Count errors per minute
rate({job="emailengine"} | json | level="50"[1m])

# Search message content
{job="emailengine"} |= "connection failed"
```

### Datadog

Send logs to Datadog:

#### Using Datadog Agent

**datadog.yaml:**

```yaml
logs_enabled: true
logs_config:
  container_collect_all: true
  processing_rules:
    - type: multi_line
      name: new_log_start_with_date
      pattern: \{"level"
```

**docker-compose.yml:**

```yaml
version: '3.8'
services:
  emailengine:
    image: postalsys/emailengine:latest
    labels:
      com.datadoghq.ad.logs: '[{"source": "emailengine", "service": "emailengine"}]'
```

#### Using HTTP Endpoint

Ship logs directly to Datadog:

```javascript
// custom-logger.js
const pino = require('pino');
const fetch = require('node-fetch');

const logger = pino({
  level: process.env.EENGINE_LOG_LEVEL || 'info',
  hooks: {
    logMethod(inputArgs, method) {
      // Send to Datadog
      const log = inputArgs[0];

      fetch('https://http-intake.logs.datadoghq.com/v1/input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': process.env.DATADOG_API_KEY
        },
        body: JSON.stringify({
          ddsource: 'emailengine',
          service: 'emailengine',
          hostname: require('os').hostname(),
          ...log
        })
      }).catch(err => console.error('Failed to send to Datadog:', err));

      return method.apply(this, inputArgs);
    }
  }
});

module.exports = logger;
```

### Splunk

Forward logs to Splunk:

#### Using Splunk Universal Forwarder

**inputs.conf:**

```ini
[monitor:///var/log/emailengine/*.log]
disabled = false
index = emailengine
sourcetype = _json
```

#### Using HTTP Event Collector

```javascript
// Send to Splunk HEC
const SplunkLogger = require('splunk-logging').Logger;

const splunk = new SplunkLogger({
  token: process.env.SPLUNK_HEC_TOKEN,
  url: 'https://splunk.example.com:8088'
});

// Pipe Pino to Splunk
const through = require('through2');

process.stdin
  .pipe(through.obj(function (chunk, enc, cb) {
    try {
      const log = JSON.parse(chunk.toString());

      splunk.send({
        message: log,
        severity: log.level >= 50 ? 'error' : 'info',
        metadata: {
          source: 'emailengine',
          sourcetype: '_json',
          index: 'emailengine'
        }
      });
    } catch (err) {
      // Ignore parse errors
    }
    cb();
  }));
```

Run:

```bash
node server.js | node splunk-forwarder.js
```

## Debugging with Logs

### Enable Debug Logging

For troubleshooting specific issues:

```bash
# Debug everything
EENGINE_LOG_LEVEL=debug node server.js

# Trace level for maximum detail
EENGINE_LOG_LEVEL=trace node server.js

# Filter logs to specific component
node server.js | grep "webhook"
node server.js | jq 'select(.account == "john@example.com")'
```

### Common Log Patterns

#### Account Connection Issues

```bash
# Find connection errors
cat logs/emailengine.log | jq 'select(.msg | contains("connection")) | select(.level >= 40)'

# Group by error type
cat logs/emailengine.log | jq -r 'select(.err) | .err.message' | sort | uniq -c | sort -rn
```

#### Webhook Failures

```bash
# Find webhook failures
cat logs/emailengine.log | jq 'select(.msg | contains("webhook")) | select(.level >= 40)'

# Get webhook URLs that failed
cat logs/emailengine.log | jq -r 'select(.webhook) | select(.level >= 40) | .webhook.url' | sort | uniq -c
```

#### Performance Issues

```bash
# Find slow operations
cat logs/emailengine.log | jq 'select(.duration > 5000)'

# Get average processing time
cat logs/emailengine.log | jq -s 'map(select(.duration)) | map(.duration) | add / length'
```

#### Account Activity

```bash
# Messages per account
cat logs/emailengine.log | jq -r 'select(.msg == "messageNew") | .account' | sort | uniq -c | sort -rn

# Accounts with errors
cat logs/emailengine.log | jq -r 'select(.level >= 50) | .account' | sort | uniq
```

### Real-Time Log Monitoring

#### Tail and Filter

```bash
# Tail with pretty printing
tail -f logs/emailengine.log | pino-pretty

# Tail specific account
tail -f logs/emailengine.log | jq 'select(.account == "john@example.com")'

# Tail errors only
tail -f logs/emailengine.log | jq 'select(.level >= 50)'

# Tail webhooks
tail -f logs/emailengine.log | jq 'select(.msg | contains("webhook"))'
```

#### Watch Commands

```bash
# Watch error count
watch -n 1 'grep "level\":50" logs/emailengine.log | wc -l'

# Watch active accounts
watch -n 5 'grep "Account connected" logs/emailengine.log | tail -10'
```

## Log Analysis

### Generate Statistics

```bash
# Error count by hour
cat logs/emailengine.log | \
  jq -r 'select(.level >= 50) | .time' | \
  while read ts; do date -d @$(($ts/1000)) +%Y-%m-%d\ %H:00; done | \
  sort | uniq -c

# Top error messages
cat logs/emailengine.log | \
  jq -r 'select(.level >= 50) | .err.message // .msg' | \
  sort | uniq -c | sort -rn | head -20

# Webhook success rate
TOTAL=$(grep "webhook" logs/emailengine.log | wc -l)
FAILED=$(grep "webhook.*failed" logs/emailengine.log | wc -l)
echo "scale=2; ($TOTAL - $FAILED) * 100 / $TOTAL" | bc
```

### Performance Analysis

```bash
# 95th percentile response time
cat logs/emailengine.log | \
  jq -r 'select(.duration) | .duration' | \
  sort -n | \
  awk '{all[NR] = $0} END{print all[int(NR*0.95)]}'

# Average messages per minute (last hour)
cat logs/emailengine.log | \
  jq -r 'select(.msg == "messageNew") | .time' | \
  tail -60 | wc -l
```

## Environment Variables

Control logging behavior with these environment variables:

```bash
# Log level (fatal, error, warn, info, debug, trace)
EENGINE_LOG_LEVEL=info

# Enable/disable colors in pretty mode
EENGINE_LOG_NO_COLORS=false

# Log to file instead of stdout
EENGINE_LOG_FILE=/var/log/emailengine/app.log

# Enable raw IMAP/SMTP protocol logging (very verbose!)
EENGINE_LOG_RAW=false
```

## Best Practices

### 1. Use Appropriate Log Levels in Production

```bash
# Production
EENGINE_LOG_LEVEL=info

# Avoid trace/debug in production (performance impact)
```

### 2. Implement Log Rotation

Always rotate logs to prevent disk space issues:

```bash
# PM2
pm2 install pm2-logrotate

# SystemD
sudo logrotate /etc/logrotate.d/emailengine

# Docker
# Use docker logging driver with size limits
```

### 3. Ship Logs to Central Platform

Don't rely on local logs:

```bash
# Use Filebeat, Promtail, or Datadog Agent
# Centralize logs for easier searching
```

### 4. Set Up Log-Based Alerts

Alert on error patterns:

```bash
# Alert on high error rate
# Alert on specific error messages
# Alert on webhook failures
```

### 5. Sanitize Sensitive Data

Avoid logging passwords or tokens:

```javascript
// Good - sanitized
logger.info({ account: 'john@example.com' }, 'Account connected');

// Bad - includes sensitive data
logger.info({ password: 'secret123' }, 'Authentication');
```

### 6. Structure Log Messages

Use consistent message formats:

```javascript
// Good - structured
logger.info({
  account: 'john@example.com',
  messageId: '<abc@example.com>',
  action: 'message_sent'
}, 'Message sent successfully');

// Bad - unstructured
logger.info('Sent message <abc@example.com> from john@example.com');
```

## Troubleshooting

### Logs Not Appearing

**Check stdout is not redirected:**

```bash
# Run without redirection
node server.js

# Check if logs appear
```

**Verify log level:**

```bash
# Set to trace temporarily
EENGINE_LOG_LEVEL=trace node server.js
```

### Log Files Growing Too Large

**Implement rotation:**

```bash
# Check current size
du -sh /var/log/emailengine/

# Force rotation
sudo logrotate -f /etc/logrotate.d/emailengine
```

### Performance Issues with Logging

**Reduce log level:**

```bash
# Use info instead of debug/trace
EENGINE_LOG_LEVEL=info
```

**Disable raw protocol logging:**

```bash
# This is very verbose
EENGINE_LOG_RAW=false
```

### Logs Not Reaching Aggregation Platform

**Test connection:**

```bash
# Filebeat
sudo filebeat test output

# Promtail
curl http://loki:3100/ready
```

**Check log format:**

```bash
# Ensure logs are valid JSON
cat logs/emailengine.log | jq . > /dev/null
```

## Next Steps

- Configure [Monitoring](/docs/advanced/monitoring) with Prometheus and Grafana
- Set up [Performance Tuning](/docs/advanced/performance-tuning) based on log analysis
- Review [Webhook Debugging](/docs/receiving/webhooks#debugging-webhooks) techniques
- Implement [Error Handling](/docs/troubleshooting) procedures

## Related Resources

- [Pino Documentation](https://github.com/pinojs/pino)
- [ELK Stack Guide](https://www.elastic.co/what-is/elk-stack)
- [Grafana Loki](https://grafana.com/oss/loki/)
- [Log Rotation Best Practices](https://linux.die.net/man/8/logrotate)
