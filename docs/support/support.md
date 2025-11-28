---
title: Support
description: Get help with EmailEngine - support channels, bug reports, and feature requests
sidebar_position: 2
---

# Support

Get help with EmailEngine through our support channels.

## Contact Support

**Email:** [support@postalsys.com](mailto:support@postalsys.com)

- Response time: Usually within 24 hours on business days
- Bug reports are prioritized
- Include your EmailEngine version and relevant logs when reporting issues

## What's Included

**With active subscription:**

- Email support via support@postalsys.com
- Bug fixes and patches
- Access to all EmailEngine updates
- Priority handling for critical issues

**For all users:**

- Full documentation at [learn.emailengine.app](https://learn.emailengine.app)
- [GitHub Issues](https://github.com/postalsys/emailengine/issues) for bug reports and feature requests

## Reporting Issues

When reporting a bug or issue, please include:

1. **EmailEngine version** - Check via `GET /v1/stats` or the dashboard
2. **Environment details** - OS, Node.js version, Redis version
3. **Steps to reproduce** - Clear description of how to trigger the issue
4. **Error messages** - Full error messages and stack traces
5. **Relevant logs** - EmailEngine logs around the time of the issue

**Example bug report:**

```
EmailEngine version: 2.58.1
OS: Ubuntu 22.04
Node.js: 20.10.0
Redis: 7.2.3

Issue: Webhook delivery fails for large attachments

Steps to reproduce:
1. Configure webhook endpoint
2. Send email with 10MB attachment to monitored account
3. Webhook is never delivered

Error in logs:
[timestamp] Error: Request body too large
```

## Feature Requests

Submit feature requests via:

- **GitHub Issues:** [github.com/postalsys/emailengine/issues](https://github.com/postalsys/emailengine/issues)
- **Email:** support@postalsys.com

When requesting features, describe:

- The problem you're trying to solve
- Your current workaround (if any)
- The expected behavior

## Not Included

Standard support does not include:

- Custom development or modifications
- On-site training or workshops
- Consulting services
- Architecture review
- Integration development
- White-glove onboarding

For custom development or consulting needs, contact support@postalsys.com to discuss options.

## Self-Help Resources

Before contacting support, check these resources:

- **[Documentation](/docs)** - Comprehensive guides and API reference
- **[Troubleshooting Guide](/docs/troubleshooting)** - Common issues and solutions
- **[GitHub Issues](https://github.com/postalsys/emailengine/issues)** - Search existing issues
- **[Changelog](https://github.com/postalsys/emailengine/releases)** - Recent updates and fixes
