---
title: Monitoring Configuration
description: Configure Prometheus metrics, health checks, and monitoring endpoints
sidebar_position: 6
---

### Setting up Prometheus
EmailEngine allows monitoring via a Prometheus scraping endpoint. To enable it, you need first to generate an access token for Prometheus. To do so, click on the "Create new" button on the access tokens page in EmailEngine, uncheck "All scopes" in the form and check the "Metrics" scope before creating the token.
Next, set up a Prometheus scraping job. Use the newly generated access token as the value for the `credentials` field.
```yaml
- job_name: 'emailengine'
scrape_interval: 10s
metrics_path: '/metrics'
scheme: 'http'
authorization:
type: Bearer
credentials: 795f623527c16d617b106...
static_configs:
- targets: ['127.0.0.1:3000']
```
Next, restart the Prometheus service and check the "Targets" page in the Prometheus UI to see if it was able to pick up the metrics from EmailEngine or not.