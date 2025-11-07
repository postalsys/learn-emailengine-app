<a href="/" id="headerLogo" class="header__logoImg"><img src="lib_pTNsKLAHHUZrxQKE/xwb20trbbhmhskes.png?w=160" width="80" alt="Your Logo" /></a>

[Download](/#downloads)

Using EmailEngine

<a href="https://api.emailengine.app/" target="_blank" rel="noreferer noopener"></a>

API reference

[](/authenticating-api-requests)

Authenticating API requests

[](/hosted-authentication)

Hosted authentication

[](/webhooks)

Webhooks

[](/sending-emails)

Sending emails

[](/supported-account-types)

Supported Account Types

[](/oauth2-configuration)

OAuth2 configuration

[](/bounces)

Bounce detection

[](/email-templates)

Email templates

[](/shared-mailboxes-in-ms-365)

Shared Mailboxes in MS365

[](/virtual-mailing-lists)

Virtual mailing lists and unsubscribe

[](/pre-processing-functions)

Pre-processing functions

Operating EmailEngine

[](/set-up)

Installation instructions

[](/redis)

Redis requirements

[](/configuration)

Configuration options

[](/reset-password)

Reset password

[](/system-d-service)

Run as a SystemD service

[](/docker)

Run as a Docker container

[](/monitoring)

Monitoring

[](/logging)

Log management

[](/local-addresses)

Local IP-addresses

[](/prepared-settings)

Prepared settings

[](/prepared-access-token)

Prepared access token

[](/prepared-license)

Prepared license key

[](/troubleshooting)

Troubleshooting

[](/expose-public-https)

Use Nginx as a proxy

[FAQ](/#faq)<a href="https://docs.emailengine.app/" target="_blank" rel="noreferer noopener">Blog</a>[Support](/support)

<a href="https://postalsys.com/plans" id="btn_ff6353u9jsc" class="btn primary" target="_blank" rel="noopener noreferrer">Get a license key<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMWVtIiB2aWV3Ym94PSIwIDAgMTUgMTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkuNiA3SDFhMSAxIDAgMSAxIDAtMmg4LjZMNyAyLjRBMSAxIDAgMCAxIDguNCAxbDQuMyA0LjJjLjIuMy4zLjUuMy44IDAgLjMtLjEuNS0uMy43TDguNCAxMUExIDEgMCAxIDEgNyA5LjVMOS42IDd6IiBmaWxsPSJjdXJyZW50Q29sb3IiIC8+PC9zdmc+" /></a>

Menu

- <a href="/#downloads" class="drawerLink">Download</a>
- Using EmailEngine
  [](https://api.emailengine.app/)
  API reference
  [](/authenticating-api-requests)
  Authenticating API requests
  [](/hosted-authentication)
  Hosted authentication
  [](/webhooks)
  Webhooks
  [](/sending-emails)
  Sending emails
  [](/supported-account-types)
  Supported Account Types
  [](/oauth2-configuration)
  OAuth2 configuration
  [](/bounces)
  Bounce detection
  [](/email-templates)
  Email templates
  [](/shared-mailboxes-in-ms-365)
  Shared Mailboxes in MS365
  [](/virtual-mailing-lists)
  Virtual mailing lists and unsubscribe
  [](/pre-processing-functions)
  Pre-processing functions
- Operating EmailEngine
  [](/set-up)
  Installation instructions
  [](/redis)
  Redis requirements
  [](/configuration)
  Configuration options
  [](/reset-password)
  Reset password
  [](/system-d-service)
  Run as a SystemD service
  [](/docker)
  Run as a Docker container
  [](/monitoring)
  Monitoring
  [](/logging)
  Log management
  [](/local-addresses)
  Local IP-addresses
  [](/prepared-settings)
  Prepared settings
  [](/prepared-access-token)
  Prepared access token
  [](/prepared-license)
  Prepared license key
  [](/troubleshooting)
  Troubleshooting
  [](/expose-public-https)
  Use Nginx as a proxy
- <a href="/#faq" class="drawerLink">FAQ</a>
- <a href="https://docs.emailengine.app/" class="drawerLink">Blog</a>
- <a href="/support" class="drawerLink">Support</a>
- [](https://postalsys.com/plans)
  Get a license key
  ![](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTMiIGhlaWdodD0iMTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkuNTU3IDdIMWExIDEgMCAxIDEgMC0yaDguNTg2TDcuMDA3IDIuNDIxYTEgMSAwIDAgMSAxLjQxNC0xLjQxNGw0LjI0MyA0LjI0M2MuMjAzLjIwMi4zLjQ3LjI5Mi43MzZhLjk5Ny45OTcgMCAwIDEtLjI5Mi43MzVMOC40MiAxMC45NjRBMSAxIDAgMSAxIDcuMDA3IDkuNTVMOS41NTcgN3oiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz48L3N2Zz4=)

# Configuration

Configuring and Running EmailEngine

EmailEngine uses two types of configurations:

1.  **Application Configuration**: This is loaded when the application starts and includes settings such as the HTTP port number.
2.  **Runtime Configuration**: This can be updated at any time via the [Settings API endpoint](https://api.emailengine.app/#operation/postV1Settings) or through the built-in web interface. Examples include the webhook destination URL.

You can configure the application using either command-line arguments or environment variables. If both are provided for the same setting, the environment variable will take precedence over the command-line argument.

## General settings

These are the main application settings.

| Configuration Option | CLI Argument | ENV Value | Default |
|----|----|----|----|
| IMAP Worker Count | `--workers.imap=4` | `EENGINE_WORKERS=4` | `4` |
| Max Command Duration | `--service.commandTimeout=10s` | `EENGINE_TIMEOUT=10s` | `10s` |
| Delay Between Creating Each IMAP Connection | `--service.setupDelay=0ms` | `EENGINE_CONNECTION_SETUP_DELAY=0ms` | `0ms` |
| [Log Level](https://emailengine.app/logging#loglevels) | `--log.level="level"` | `EENGINE_LOG_LEVEL=level` | `"trace"` |
| [Log Raw Data](/logging#logs-eerawlog) | `--log.raw=false` | `EENGINE_LOG_RAW=false` | `false` |
| Webhook Worker Count | `--workers.webhooks=1` | `EENGINE_WORKERS_WEBHOOKS=1` | `1` |
| Submit Worker Count | `--workers.submit=1` | `EENGINE_WORKERS_SUBMIT=1` | `1` |
| [Prepared Settings](/prepared-settings) | `--settings='{"JSON"}'` | `EENGINE_SETTINGS='{"JSON"}'` | not set |
| [Prepared Access Token](/prepared-access-token) | `--preparedToken="token..."` | `EENGINE_PREPARED_TOKEN="token..."` | not set |
| [Prepared License Key](/prepared-license) | `--preparedLicense="..."` | `EENGINE_PREPARED_LICENSE="..."` | not set |
| [Encryption Secret](https://docs.emailengine.app/enabling-secret-encryption/) | `--service.secret="****"` | `EENGINE_SECRET="****"` | not set |
| Chunk Size for Attachment Download Streams (in bytes) | not available | `EENGINE_CHUNK_SIZE=1MB` | `1MB` |
| Time to Wait for IMAP Access Lock After Failed Login Attempts | not available | `EENGINE_MAX_IMAP_AUTH_FAILURE_TIME=3days` | `3 days` |
| Restrict IP Addresses for Admin UI Access | not available | `EENGINE_ADMIN_ACCESS_ADDRESSES=127.0.0.1,192.168.1.152` | not set |

## IMAP Worker Count

You can set a fixed number of worker threads (the default is 4), or use the special value `"cpus"`, which automatically matches the number of worker threads to the available CPU cores.

**Example:**

    $ emailengine --workers.imap=cpus

## Redis Configuration

Database options.

| Configuration Option | CLI Argument | ENV Value | Default |
|----|----|----|----|
| Redis Connection URL | `--dbs.redis="url"` | `EENGINE_REDIS="url"` | `"redis://127.0.0.1:6379/8"` |
| Key Prefix | not available | `EENGINE_REDIS_PREFIX="myprefix"` | not set |

If you run multiple EmailEngine instances on the same Redis server, ensure that you use a different database number or unique key prefixes to prevent conflicts.

For non-default Redis configurations, such as when your Redis instance is hosted remotely or requires authentication, provide the Redis connection details as a connection string in the following format:

    redis://:password@hostname:port/db-number

**Example:**

    $ emailengine --dbs.redis="redis://:supersecret@178.32.207.71:6379/8"

## API server settings

Web server settings for the API and web UI.

| Configuration Option | CLI Argument | ENV Value | Default |
|----|----|----|----|
| Host to Bind To | `--api.host="1.2.3.4"` | `EENGINE_HOST="1.2.3.4"` | `"127.0.0.1"` |
| Port to Bind To | `--api.port=port` | `EENGINE_PORT=port` | `3000` |
| Max Attachment Size | `--api.maxSize=5MB` | `EENGINE_MAX_SIZE=5MB` | `5MB` |
| Max POST Body Size When Uploading Messages | `--api.maxBodySize=50MB` | `EENGINE_MAX_BODY_SIZE=50MB` | `50MB` |
| Max Allowed Time to Upload a Message | `--api.maxPayloadTimeout=10s` | `EENGINE_MAX_PAYLOAD_TIMEOUT=10s` | `10s` |
| CORS Allowed Origin | `--cors.origin="*"` | `EENGINE_CORS_ORIGIN="*"` | not set |
| CORS Max Age | `--cors.maxAge=60s` | `EENGINE_CORS_MAX_AGE=60s` | `60s` |

> To specify multiple CORS origins, use a space-separated string value, or add a separate `--cors.origin` argument for each origin.

| Configuration Option | CLI Argument | ENV Value | Default |
|----|----|----|----|
| HTTPS Enabled |  | `EENGINE_API_TLS="true"` | `"false"` |
| HTTPS Private Key | `--api.tls.keyPath="/key.pem"` | `EENGINE_API_TLS_KEY_FILE="/key.pem"` |  |
| HTTPS Certificate Chain | `--api.tls.certPath="/cert.pem"` | `EENGINE_API_TLS_CERT_FILE="/cert.pem"` |  |

> **Note:** Use HTTPS only if your reverse proxy and EmailEngine instances are on different servers. For localhost connections, prefer HTTP.

## Queue Settings

Concurrency options for queue handling.

### Concurrency

Each queue worker processes one job at a time (concurrency = 1).  
Increase concurrency only when event order is irrelevant, because setting concurrency greater than 1 can reorder events.

| Queue      | CLI flag            | ENV variable          | Default |
|------------|---------------------|-----------------------|---------|
| Webhooks   | `--queues.notify=1` | `EENGINE_NOTIFY_QC=1` | `1`     |
| Submission | `--queues.submit=1` | `EENGINE_SUBMIT_QC=1` | `1`     |

### Submission delay

| Setting | CLI flag | ENV variable | Default |
|----|----|----|----|
| Delay between submissions | `--submitDelay=5s` | `EENGINE_SUBMIT_DELAY=5s` | *unset* |

When configured, EmailEngine waits the given duration after delivering one message before attempting the next message in the submission queue.

**Global scope**: the delay applies to the entire submission queue, not per account.  
Example: 10 accounts × 10 messages × 6 s delay = 10 min to send all 100 messages.

## Dotenv File

If the working directory contains a "dotenv" file (named `.env`), EmailEngine will use it to set environment variables.

The dotenv file follows the `KEY=VALUE` format, with each entry on a separate line, like this:

    EENGINE_WORKERS=2
    EENGINE_REDIS="redis://127.0.0.1:6379/8"

Lines starting with `#` are treated as comments and will be ignored, as will empty lines.

## ENV Values from Files

You can also set individual environment variables by specifying a file that contains the value. To do this, use an environment key with a `_FILE` suffix and provide the path to the file.

If an environment variable is not set directly, EmailEngine will check if a corresponding file path variable exists. If it finds one, EmailEngine will attempt to read the value from the specified file.

In the example below, the value for `EENGINE_SECRET` is provided from a file located at `"/path/to/secret.txt"`:

    $ echo 'secretpass' > /path/to/secret.txt
    $ export EENGINE_SECRET_FILE=/path/to/secret.txt
    $ emailengine

© 2021-2025 Postal Systems OÜ

[Terms of Service](https://postalsys.com/tos)[Privacy Policy](/privacy-policy)[About](/about)[EmailEngine License](https://emailengine.dev/license.md)

- <a href="https://twitter.com/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzc4IiBoZWlnaHQ9IjM4NyIgdmlld2JveD0iMCAwIDM3OCAzODciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIyMS4xODEgMTc0LjAwM0wzNDUuMTQ3IDMzSDMxNS43NzFMMjA4LjEzIDE1NS40MzFMMTIyLjE1OSAzM0gyM0wxNTMuMDA2IDIxOC4xMzdMMjMgMzY2SDUyLjM3NzVMMTY2LjA0OCAyMzYuNzA5TDI1Ni44NDEgMzY2SDM1NkwyMjEuMTczIDE3NC4wMDNIMjIxLjE4SDIyMS4xODFaTTE4MC45NDMgMjE5Ljc2OEwxNjcuNzcxIDIwMS4zMzJMNjIuOTYzMyA1NC42Mzk5SDEwOC4wODZMMTkyLjY2NyAxNzMuMDI2TDIwNS44MzkgMTkxLjQ2MkwzMTUuNzg1IDM0NS4zNDVIMjcwLjY2MkwxODAuOTQzIDIxOS43NzVWMjE5Ljc2OFoiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz48L3N2Zz4=" /></a>
- <a href="https://github.com/postalsys/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCA0OTYgNTEyIj48cGF0aCBkPSJNMTY1LjkgMzk3LjRjMCAyLTIuMyAzLjYtNS4yIDMuNi0zLjMuMy01LjYtMS4zLTUuNi0zLjYgMC0yIDIuMy0zLjYgNS4yLTMuNiAzLS4zIDUuNiAxLjMgNS42IDMuNnptLTMxLjEtNC41Yy0uNyAyIDEuMyA0LjMgNC4zIDQuOSAyLjYgMSA1LjYgMCA2LjItMnMtMS4zLTQuMy00LjMtNS4yYy0yLjYtLjctNS41LjMtNi4yIDIuM3ptNDQuMi0xLjdjLTIuOS43LTQuOSAyLjYtNC42IDQuOS4zIDIgMi45IDMuMyA1LjkgMi42IDIuOS0uNyA0LjktMi42IDQuNi00LjYtLjMtMS45LTMtMy4yLTUuOS0yLjl6TTI0NC44IDhDMTA2LjEgOCAwIDExMy4zIDAgMjUyYzAgMTEwLjkgNjkuOCAyMDUuOCAxNjkuNSAyMzkuMiAxMi44IDIuMyAxNy4zLTUuNiAxNy4zLTEyLjEgMC02LjItLjMtNDAuNC0uMy02MS40IDAgMC03MCAxNS04NC43LTI5LjggMCAwLTExLjQtMjkuMS0yNy44LTM2LjYgMCAwLTIyLjktMTUuNyAxLjYtMTUuNCAwIDAgMjQuOSAyIDM4LjYgMjUuOCAyMS45IDM4LjYgNTguNiAyNy41IDcyLjkgMjAuOSAyLjMtMTYgOC44LTI3LjEgMTYtMzMuNy01NS45LTYuMi0xMTIuMy0xNC4zLTExMi4zLTExMC41IDAtMjcuNSA3LjYtNDEuMyAyMy42LTU4LjktMi42LTYuNS0xMS4xLTMzLjMgMi42LTY3LjkgMjAuOS02LjUgNjkgMjcgNjkgMjcgMjAtNS42IDQxLjUtOC41IDYyLjgtOC41czQyLjggMi45IDYyLjggOC41YzAgMCA0OC4xLTMzLjYgNjktMjcgMTMuNyAzNC43IDUuMiA2MS40IDIuNiA2Ny45IDE2IDE3LjcgMjUuOCAzMS41IDI1LjggNTguOSAwIDk2LjUtNTguOSAxMDQuMi0xMTQuOCAxMTAuNSA5LjIgNy45IDE3IDIyLjkgMTcgNDYuNCAwIDMzLjctLjMgNzUuNC0uMyA4My42IDAgNi41IDQuNiAxNC40IDE3LjMgMTIuMUM0MjguMiA0NTcuOCA0OTYgMzYyLjkgNDk2IDI1MiA0OTYgMTEzLjMgMzgzLjUgOCAyNDQuOCA4ek05Ny4yIDM1Mi45Yy0xLjMgMS0xIDMuMy43IDUuMiAxLjYgMS42IDMuOSAyLjMgNS4yIDEgMS4zLTEgMS0zLjMtLjctNS4yLTEuNi0xLjYtMy45LTIuMy01LjItMXptLTEwLjgtOC4xYy0uNyAxLjMuMyAyLjkgMi4zIDMuOSAxLjYgMSAzLjYuNyA0LjMtLjcuNy0xLjMtLjMtMi45LTIuMy0zLjktMi0uNi0zLjYtLjMtNC4zLjd6bTMyLjQgMzUuNmMtMS42IDEuMy0xIDQuMyAxLjMgNi4yIDIuMyAyLjMgNS4yIDIuNiA2LjUgMSAxLjMtMS4zLjctNC4zLTEuMy02LjItMi4yLTIuMy01LjItMi42LTYuNS0xem0tMTEuNC0xNC43Yy0xLjYgMS0xLjYgMy42IDAgNS45IDEuNiAyLjMgNC4zIDMuMyA1LjYgMi4zIDEuNi0xLjMgMS42LTMuOSAwLTYuMi0xLjQtMi4zLTQtMy4zLTUuNi0yeiIgZmlsbD0iY3VycmVudENvbG9yIiAvPjwvc3ZnPg==" /></a>
