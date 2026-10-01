---
title: Integrations Overview
sidebar_position: 1
description: Where to start when connecting EmailEngine to a PHP application, a CRM, a low-code platform or an AI agent
---

# Integrations Overview

EmailEngine exposes every email account it manages through one REST API and one webhook stream, so an integration is HTTP and JSON whatever the application on the other side. The pages in this section cover the environments that need more than a plain HTTP client.

## Integration Guides

| Guide | What it covers |
| --- | --- |
| [PHP Integration](/docs/integrations/php) | The published PHP SDK, [postalsys/emailengine-php](https://packagist.org/packages/postalsys/emailengine-php), and the calls it does not cover |
| [CRM Integration](/docs/integrations/crm) | Keeping a CRM's activity timeline in step with a mailbox: account onboarding through the hosted form, message sync from webhooks, sending as the CRM user |
| [Low-Code Integrations](/docs/integrations/low-code) | Zapier, Make and n8n: receiving webhooks, calling the API, and reshaping payloads with webhook routes |
| [OpenAPI Specification](/docs/api-reference/openapi-spec) | The document every instance publishes, for generating a typed client in any other language |

## Related Features

| Feature | What it covers |
| --- | --- |
| [MCP for AI Agents](/docs/mcp) | The opposite direction from an integration: an AI client such as Claude Code or Cursor calls EmailEngine directly, through the Model Context Protocol endpoint and a narrowed access token |
| [AI Processing](/docs/receiving/ai-processing) | EmailEngine calling a model itself, to attach a summary, sentiment and risk score to each new message's `messageNew` webhook |
| [Webhook Routes](/docs/webhooks/webhook-routing) | Sending different events to different endpoints, with filter and map functions, when one receiver is not enough |

## See Also

- [API Reference](/docs/api-reference) - Authentication, conventions, and error handling
- [Webhooks overview](/docs/webhooks/overview) - The event side of every integration here
- [Access tokens](/docs/api-reference/access-tokens) - One narrowed token per integration
- [Support](/docs/support) - Support channels and what a subscription covers
