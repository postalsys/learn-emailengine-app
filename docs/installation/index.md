---
title: Install EmailEngine - Setup Guide for All Platforms
description: Install EmailEngine on Linux, macOS, Windows, or Docker, with one-click cloud deployments for Render, DigitalOcean, Heroku, Easypanel, and Hostinger.
sidebar_position: 1
keywords:
  - install EmailEngine
  - EmailEngine Docker
  - EmailEngine setup
  - self-hosted email API installation
  - email gateway setup
---

# Installing EmailEngine

Choose your installation method based on your operating system and deployment requirements.

## Quick Start

```bash
# npm: Install globally (requires Node.js 20+)
npm install -g emailengine-app
emailengine --dbs.redis="redis://127.0.0.1:6379/8"

# Linux: Download binary
wget https://go.emailengine.app/emailengine.tar.gz
tar xzf emailengine.tar.gz
sudo mv emailengine /usr/local/bin/

# Docker: Run container
docker run -p 3000:3000 --env EENGINE_REDIS="redis://host.docker.internal:6379/8" postalsys/emailengine:v2

# Source: Production deployment (the tarball has no top-level directory, so make one)
wget https://go.emailengine.app/source-dist.tar.gz
mkdir emailengine && tar xzf source-dist.tar.gz -C emailengine && cd emailengine
node server.js
```

## Verifying a Download

Every release carries a `hashes.txt` asset next to the binaries. It is a PGP-signed message listing the SHA-256 digest of each file, the commit the release was built from, and the Node.js version bundled into the binaries:

```bash
curl -LO https://go.emailengine.app/emailengine.tar.gz
curl -LO https://go.emailengine.app/hashes.txt

# The two digests must match (shasum -a 256 on macOS)
sha256sum emailengine.tar.gz
grep emailengine.tar.gz hashes.txt
```

The list is signed by the `Postalsys Releases <releases@postalsys.com>` key, fingerprint `9777 3593 92D7 9550 B4BF F1AF B6F0 7B59 064F 9CCA`, published among the maintainer's keys on GitHub. To check the signature as well:

```bash
curl -sL https://github.com/andris9.gpg | gpg --import
gpg --verify hashes.txt
```

A good signature names that fingerprint. The warning that the key is not certified only means you have not signed it yourself; compare the fingerprint instead.

For a pinned version, use `https://go.emailengine.app/download/vX.X.X/hashes.txt`, the same way as for the binaries.

## Installation Methods

### By Operating System

#### [Linux Installation](/docs/installation/linux)

Install on any distribution.

**Methods:**

- Automated installer (Ubuntu/Debian) - installs Redis, Caddy, and a SystemD service in one run
- Binary installation - standalone x86_64 executable
- Source installation

**Best for:** Servers, VPS hosting, production deployments

[View Linux guide →](/docs/installation/linux)

---

#### [macOS Installation](/docs/installation/macos)

Install on macOS (Apple Silicon or Intel).

**Methods:**

- PKG installer - signed and notarized package, one per architecture
- Source installation

**Best for:** Development, testing, local deployments

[View macOS guide →](/docs/installation/macos)

---

#### [Windows Installation](/docs/installation/windows)

Install on Windows (native or WSL2).

**Methods:**

- Windows executable - standalone .exe with a Redis-compatible server such as Memurai
- WSL2 installation - the Linux build inside Windows
- Docker Desktop

**Best for:** Development, testing, Windows servers

[View Windows guide →](/docs/installation/windows)

### By Deployment Type

#### [Docker Installation](/docs/installation/docker)

Run in containers with Docker or Docker Compose.

**Features:**

- Isolated environment
- Easy scaling
- Quick updates
- Consistent across platforms

**Best for:** Containerized infrastructure, Kubernetes, cloud deployments

[View Docker guide →](/docs/installation/docker)

---

#### [Source Installation](/docs/installation/source)

Run from source code (Node.js 20+ required, 24+ recommended). This is also the installation that runs in [FIPS mode](/docs/deployment/fips-mode) on a FIPS-enabled host.

[View source guide →](/docs/installation/source)

## System Requirements

### Minimum (Development/Testing)

- **CPU:** 1-2 cores
- **RAM:** 2 GB
- **Storage:** 10 GB
- **Network:** Stable internet connection

### Recommended (Production)

- **CPU:** 4+ cores
- **RAM:** 4-8 GB (or more for high-volume)
- **Storage:** 20+ GB SSD
- **Network:** Low-latency, high-bandwidth connection

## Cloud Platforms

### One-Click Deployments

EmailEngine is available on popular cloud platforms:

#### Render.com

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/postalsys/emailengine)

Automatic setup with managed Redis.

[View Render guide →](/docs/deployment/render)

#### DigitalOcean Marketplace

[![DigitalOcean](/img/external/QBubXuGF1M.svg)](https://marketplace.digitalocean.com/apps/emailengine?refcode=90a107552b31)

One-click droplet with everything pre-configured.

**Note:** DigitalOcean blocks outbound SMTP ports 25, 465, and 587 on Droplets (per [Why is SMTP blocked?](https://docs.digitalocean.com/support/why-is-smtp-blocked/), checked 2026-08-26), so an EmailEngine on a Droplet can receive mail but cannot reach most providers' SMTP servers to send. Sending needs an SMTP relay on a port that is not blocked, or a host that allows SMTP.

#### Heroku

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/postalsys/emailengine)

The button reads the `app.json` in the EmailEngine repository. It provisions a `heroku-redis` add-on and sets `EENGINE_WORKERS=1` because the Heroku Redis add-on caps the number of client connections; raise the worker count only together with a larger Redis plan. It also sets `NODE_TLS_REJECT_UNAUTHORIZED=0`, which the template needs to reach the Heroku Redis add-on over TLS and which disables certificate validation for every outbound TLS connection EmailEngine makes.

#### Easypanel

[![Deploy on Easypanel](https://easypanel.io/img/deploy-on-easypanel-40.svg)](https://easypanel.io/templates/emailengine)

[Easypanel](https://easypanel.io) is a self-hosted Docker control panel. Its EmailEngine template is maintained by Easypanel, not by Postal Systems. It creates two services, the EmailEngine container and a password-protected Redis service, and sets `EENGINE_REDIS`, a random `EENGINE_SECRET`, and an `EENGINE_SETTINGS` value that enables the built-in SMTP server with authentication. The admin interface is served on the Easypanel domain through port 3000.

Review these form fields before deploying (template state checked 2026-10-01):

- **App Service Image** defaults to a pinned older release (`postalsys/emailengine:v2.63.3`). Set it to `postalsys/emailengine:v2` to run the current release.
- **SMTP Password** defaults to `password`. Replace it, because the template publishes the SMTP submission port. It publishes the IMAP proxy port as well, which answers nothing until the proxy is enabled.

The template starts its Redis service with `maxmemory-policy noeviction`, the policy EmailEngine requires. If the dashboard still shows the "Unsafe Redis eviction policy" banner after the first deploy, the Redis service was created from an earlier version of the template; set the policy on it by hand. See [Memory Eviction Policy](/docs/configuration/redis#memory-eviction-policy-required) for why no other policy is supported.

#### Hostinger VPS

[Hostinger](https://www.hostinger.com/applications/emailengine) offers EmailEngine as a one-click Docker application on its VPS plans. The deployment is maintained by Hostinger, not by Postal Systems, and Hostinger does not publish its configuration, so the EmailEngine version and the Redis settings it uses are not documented here. After the first deploy, check the dashboard for the "Unsafe Redis eviction policy" banner, and if it appears, set `maxmemory-policy noeviction` on the Redis instance. See [Memory Eviction Policy](/docs/configuration/redis#memory-eviction-policy-required).

[View all deployment guides →](/docs/deployment)

## Post-Installation Steps

After installing EmailEngine:

### 1. Verify Installation

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response:
# {"success":true}
```

### 2. Set the Admin Password

Open `http://localhost:3000` in your browser. A new instance has no admin password, so the admin interface opens without a login and refuses to issue access tokens until one is set. Set it under **Account** > **Security** before the instance faces a network; see [Admin Password and API Authentication](/docs/deployment/security#admin-password-and-api-authentication) for the CLI and provisioning alternatives.

### 3. Configure OAuth2

Set up OAuth2 credentials for Gmail and Microsoft 365:

[OAuth2 Configuration Guide →](/docs/accounts/oauth2-setup)

### 4. Add Your First Account

Register an email account via the web interface or API:

[Account Setup Guide →](/docs/accounts)

### 5. Set Up Webhooks

Configure webhooks to receive real-time email notifications:

[Webhooks Guide →](/docs/webhooks/overview)

### 6. Secure Your Deployment

For production deployments, follow security best practices:

[Security Guide →](/docs/deployment/security)

## Getting Help

If you encounter issues during installation:

1. **Check platform-specific guide** for detailed instructions
2. **View troubleshooting documentation** for common problems
3. **Check GitHub issues** for known problems
4. **Contact support** for assistance

[Support page →](/docs/support)

## See Also

- [Quick Start](/docs/getting-started/quick-start) - What to do once it is running
- [Configuration](/docs/configuration) - Environment variables, Redis, and prepared settings
- [Deployment](/docs/deployment) - Reverse proxies, SystemD, Kubernetes, and hardening
- [Troubleshooting](/docs/troubleshooting) - Common install and startup problems
