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

<a href="https://postalsys.com/plans" id="btn_va816uunyf" class="btn primary" target="_blank" rel="noopener noreferrer">Get a license key<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMWVtIiB2aWV3Ym94PSIwIDAgMTUgMTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkuNiA3SDFhMSAxIDAgMSAxIDAtMmg4LjZMNyAyLjRBMSAxIDAgMCAxIDguNCAxbDQuMyA0LjJjLjIuMy4zLjUuMy44IDAgLjMtLjEuNS0uMy43TDguNCAxMUExIDEgMCAxIDEgNyA5LjVMOS42IDd6IiBmaWxsPSJjdXJyZW50Q29sb3IiIC8+PC9zdmc+" /></a>

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

# Log management

What's going on under the hood

## Pino

EmailEngine logs all its messages to standard output in [Pino](https://github.com/pinojs/pino) format. Pino uses JSON structures with some predefined keys, so it is kind of human-readable but not really. Luckily, there are many tools that we can use to transform EmailEngine logs into a more suitable format. The working principle for all these log renderers is the same – you should pipe the standard output from EmailEngine to the log rendering process.

<img src="lib_pTNsKLAHHUZrxQKE/dnnoot0tgmeaaaol.png" class="media media--image" style="display:block" srcset="lib_pTNsKLAHHUZrxQKE/dnnoot0tgmeaaaol.png 2x" />

## Log levels

As EmailEngine uses pino logging library, standard pino log levels apply.

- **trace** (10)
- **debug** (20)
- **info** (30)
- **warn** (40)
- **error** (50)
- **fatal** (60)

You can limit output logs by setting a minimum log level. The default is `trace`, which means that everything is logged.

To change the logging level, either set an environment variable.

    EENGINE_LOG_LEVEL=trace

Or use a command-line argument.

    $ emailengine --log.level="trace"

## jq

`jq` is a well-known command for processing JSON structures in the command line. It is not EmailEngine specific at all, but we can easily use it to make EmailEngine logs slightly more readable.

``` bash
$ emailengine | jq
```

<img src="lib_pTNsKLAHHUZrxQKE/g8zk6fui4jfzdtxq.png" class="media media--image" style="display:block" srcset="lib_pTNsKLAHHUZrxQKE/g8zk6fui4jfzdtxq.png 2x" />

## pino-pretty

`pino-pretty` is a command-line utility that makes Pino formatted logs more readable. You can install it from the npm registry as a global command.

    $ npm install -g pino-pretty
    $ emailengine | pino-pretty

<img src="lib_pTNsKLAHHUZrxQKE/k1r29qzdnbrubbrd.png" class="media media--image" style="display:block" srcset="lib_pTNsKLAHHUZrxQKE/k1r29qzdnbrubbrd.png 2x" />

## eerawlog

`eerawlog` is an EmailEngine-specific log renderer. It is meant to help debug IMAP and API call transactions. This is the only thing it's suitable for, so it's not a general log renderer – it tends to throw away everything that is not IMAP-specific. Easier to understand how EmailEngine communicates with IMAP servers. Hard to see how the application is doing in general.

> EmailEngine must be started with the `--log.raw=true` command-line argument or with the `EENGINE_LOG_RAW=true` environment variable. Otherwise, detailed logs required by the `eerawlog` command will be disabled.

Detailed logs are disabled by default for the following reasons:

1.  raw logs can be pretty large as it includes all bytes sent and received, that includes complete email message sources
2.  raw logs do not modify secrets. Regular logs are always processed in a way where account credentials and other secrets are filtered out. Raw logs include all bytes transferred between EmailEngine and the server

<!-- -->

    $ npm install -g eerawlog
    $ emailengine --log.raw=true | eerawlog

<img src="lib_pTNsKLAHHUZrxQKE/9vlxp9d8u78gzgju.png" class="media media--image" style="display:block" srcset="lib_pTNsKLAHHUZrxQKE/9vlxp9d8u78gzgju.png 2x" />

### Filtering output

You can filter by the keys listed in log entries by adding a cli argument `--filter.[key]="value"`. If you want to include multiple values, set the same keyword multiple times.

**Example.** Only display IMAP traffic from accounts `"account1"` and `"account2"`

    $ EENGINE_LOG_RAW=true emailengine | eerawlog --filter.account="account1" --filter.account="account2"

## pino-gelf

`pino-gelf` is another useful utility that sends all log messages from EmailEngine to a [Graylog](https://www.graylog.org/) server. A neat feature is that `pino-gelf` can also work in a throughput mode so that it both sends the logs to Graylog and logs messages to console so we can mix it up with other tools like `pino-pretty`

    $ npm install -g pino-gelf
    $ emailengine | pino-gelf log -h graylog.server.com -t | pino-pretty

Something to keep in mind with `pino-gelf` is that it creates separate log keys *only* for root-level log entry keys. Object values are serialized into JSON strings:

``` json
{  
  "version":"1.1",
  "host":"emailengine",
  "short_message":"message entry",
  "full_message":"message entry",
  "timestamp":1481840140.708,
  "level":6,
  "_name":"emailengine",
  "_object_value":"{\"key\":\"value\"}",
}
```

In this case you can't search for `object_value.key` field in Graylog. Instead there will be a text field `object_value` with `{"key":"value"}` as it's value.

## Journald

If you set EmailEngine up as a [SystemsD service](/system-d-service), the application logs end up in journald. You can access these logs using the `journalctl` command.

> If you install EmailEngine from [DigitalOcean Marketplace](https://marketplace.digitalocean.com/apps/emailengine) or by using the [install script](https://emailengine.app/set-up#ubuntu), then EmailEngine uses *systemd* and *journald* by default.

**Tail logs in realtime**

    $ journalctl -t emailengine -f -o cat | pino-pretty

**List logs for the last hour**

Journald also allows to retrieve logs with time based queries. The following command lists logs for the last hour.

    $ journalctl -t emailengine --since "1 hour ago" -o cat | pino-pretty

**Tail prettified logs for a specific account**

If you have the [eerawlog](#logs-eerawlog) tool installed and set up, you can filter and pretty print IMAP and API traffic for a specific account on a running system.

    $ journalctl -t emailengine -f -o cat | eerawlog --filter.account=account_id

© 2021-2025 Postal Systems OÜ

[Terms of Service](https://postalsys.com/tos)[Privacy Policy](/privacy-policy)[About](/about)[EmailEngine License](https://emailengine.dev/license.md)

- <a href="https://twitter.com/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzc4IiBoZWlnaHQ9IjM4NyIgdmlld2JveD0iMCAwIDM3OCAzODciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIyMS4xODEgMTc0LjAwM0wzNDUuMTQ3IDMzSDMxNS43NzFMMjA4LjEzIDE1NS40MzFMMTIyLjE1OSAzM0gyM0wxNTMuMDA2IDIxOC4xMzdMMjMgMzY2SDUyLjM3NzVMMTY2LjA0OCAyMzYuNzA5TDI1Ni44NDEgMzY2SDM1NkwyMjEuMTczIDE3NC4wMDNIMjIxLjE4SDIyMS4xODFaTTE4MC45NDMgMjE5Ljc2OEwxNjcuNzcxIDIwMS4zMzJMNjIuOTYzMyA1NC42Mzk5SDEwOC4wODZMMTkyLjY2NyAxNzMuMDI2TDIwNS44MzkgMTkxLjQ2MkwzMTUuNzg1IDM0NS4zNDVIMjcwLjY2MkwxODAuOTQzIDIxOS43NzVWMjE5Ljc2OFoiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz48L3N2Zz4=" /></a>
- <a href="https://github.com/postalsys/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCA0OTYgNTEyIj48cGF0aCBkPSJNMTY1LjkgMzk3LjRjMCAyLTIuMyAzLjYtNS4yIDMuNi0zLjMuMy01LjYtMS4zLTUuNi0zLjYgMC0yIDIuMy0zLjYgNS4yLTMuNiAzLS4zIDUuNiAxLjMgNS42IDMuNnptLTMxLjEtNC41Yy0uNyAyIDEuMyA0LjMgNC4zIDQuOSAyLjYgMSA1LjYgMCA2LjItMnMtMS4zLTQuMy00LjMtNS4yYy0yLjYtLjctNS41LjMtNi4yIDIuM3ptNDQuMi0xLjdjLTIuOS43LTQuOSAyLjYtNC42IDQuOS4zIDIgMi45IDMuMyA1LjkgMi42IDIuOS0uNyA0LjktMi42IDQuNi00LjYtLjMtMS45LTMtMy4yLTUuOS0yLjl6TTI0NC44IDhDMTA2LjEgOCAwIDExMy4zIDAgMjUyYzAgMTEwLjkgNjkuOCAyMDUuOCAxNjkuNSAyMzkuMiAxMi44IDIuMyAxNy4zLTUuNiAxNy4zLTEyLjEgMC02LjItLjMtNDAuNC0uMy02MS40IDAgMC03MCAxNS04NC43LTI5LjggMCAwLTExLjQtMjkuMS0yNy44LTM2LjYgMCAwLTIyLjktMTUuNyAxLjYtMTUuNCAwIDAgMjQuOSAyIDM4LjYgMjUuOCAyMS45IDM4LjYgNTguNiAyNy41IDcyLjkgMjAuOSAyLjMtMTYgOC44LTI3LjEgMTYtMzMuNy01NS45LTYuMi0xMTIuMy0xNC4zLTExMi4zLTExMC41IDAtMjcuNSA3LjYtNDEuMyAyMy42LTU4LjktMi42LTYuNS0xMS4xLTMzLjMgMi42LTY3LjkgMjAuOS02LjUgNjkgMjcgNjkgMjcgMjAtNS42IDQxLjUtOC41IDYyLjgtOC41czQyLjggMi45IDYyLjggOC41YzAgMCA0OC4xLTMzLjYgNjktMjcgMTMuNyAzNC43IDUuMiA2MS40IDIuNiA2Ny45IDE2IDE3LjcgMjUuOCAzMS41IDI1LjggNTguOSAwIDk2LjUtNTguOSAxMDQuMi0xMTQuOCAxMTAuNSA5LjIgNy45IDE3IDIyLjkgMTcgNDYuNCAwIDMzLjctLjMgNzUuNC0uMyA4My42IDAgNi41IDQuNiAxNC40IDE3LjMgMTIuMUM0MjguMiA0NTcuOCA0OTYgMzYyLjkgNDk2IDI1MiA0OTYgMTEzLjMgMzgzLjUgOCAyNDQuOCA4ek05Ny4yIDM1Mi45Yy0xLjMgMS0xIDMuMy43IDUuMiAxLjYgMS42IDMuOSAyLjMgNS4yIDEgMS4zLTEgMS0zLjMtLjctNS4yLTEuNi0xLjYtMy45LTIuMy01LjItMXptLTEwLjgtOC4xYy0uNyAxLjMuMyAyLjkgMi4zIDMuOSAxLjYgMSAzLjYuNyA0LjMtLjcuNy0xLjMtLjMtMi45LTIuMy0zLjktMi0uNi0zLjYtLjMtNC4zLjd6bTMyLjQgMzUuNmMtMS42IDEuMy0xIDQuMyAxLjMgNi4yIDIuMyAyLjMgNS4yIDIuNiA2LjUgMSAxLjMtMS4zLjctNC4zLTEuMy02LjItMi4yLTIuMy01LjItMi42LTYuNS0xem0tMTEuNC0xNC43Yy0xLjYgMS0xLjYgMy42IDAgNS45IDEuNiAyLjMgNC4zIDMuMyA1LjYgMi4zIDEuNi0xLjMgMS42LTMuOSAwLTYuMi0xLjQtMi4zLTQtMy4zLTUuNi0yeiIgZmlsbD0iY3VycmVudENvbG9yIiAvPjwvc3ZnPg==" /></a>
