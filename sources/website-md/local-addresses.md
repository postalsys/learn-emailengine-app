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

<a href="https://postalsys.com/plans" id="btn_9vzme04mvyq" class="btn primary" target="_blank" rel="noopener noreferrer">Get a license key<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMWVtIiB2aWV3Ym94PSIwIDAgMTUgMTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkuNiA3SDFhMSAxIDAgMSAxIDAtMmg4LjZMNyAyLjRBMSAxIDAgMCAxIDguNCAxbDQuMyA0LjJjLjIuMy4zLjUuMy44IDAgLjMtLjEuNS0uMy43TDguNCAxMUExIDEgMCAxIDEgNyA5LjVMOS42IDd6IiBmaWxsPSJjdXJyZW50Q29sb3IiIC8+PC9zdmc+" /></a>

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

# Local addresses

If your server has multiple IP addresses/interfaces available, you can configure EmailEngine to use these whenever making an outbound connection to an email server.

Using multiple addresses is primarily helpful if you are making many connections and might get rate limited by destination server based on your IP address. This approach allows you to distribute connections between separate IP addresses.

## Set up local addresses

<img src="data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSIjMDAwIiBoZWlnaHQ9IjI0IiB3aWR0aD0iMjQiIHZpZXdib3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNMjU2IDhjMTM3IDAgMjQ4IDExMSAyNDggMjQ4UzM5MyA1MDQgMjU2IDUwNCA4IDM5MyA4IDI1NiAxMTkgOCAyNTYgOHptLTI4LjkgMTQzLjZsNzUuNSA3Mi40SDEyMGMtMTMuMyAwLTI0IDEwLjctMjQgMjR2MTZjMCAxMy4zIDEwLjcgMjQgMjQgMjRoMTgyLjZsLTc1LjUgNzIuNGMtOS43IDkuMy05LjkgMjQuOC0uNCAzNC4zbDExIDEwLjljOS40IDkuNCAyNC42IDkuNCAzMy45IDBMNDA0LjMgMjczYzkuNC05LjQgOS40LTI0LjYgMC0zMy45TDI3MS42IDEwNi4zYy05LjQtOS40LTI0LjYtOS40LTMzLjkgMGwtMTEgMTAuOWMtOS41IDkuNi05LjMgMjUuMS40IDM0LjR6IiAvPjwvc3ZnPg==" class="icon" />

### Open the Network configuration page.

On this page, you can manage network-related configurations like proxying and local addresses.

<img src="data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSIjMDAwIiBoZWlnaHQ9IjI0IiB3aWR0aD0iMjQiIHZpZXdib3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNMjU2IDhjMTM3IDAgMjQ4IDExMSAyNDggMjQ4UzM5MyA1MDQgMjU2IDUwNCA4IDM5MyA4IDI1NiAxMTkgOCAyNTYgOHptLTI4LjkgMTQzLjZsNzUuNSA3Mi40SDEyMGMtMTMuMyAwLTI0IDEwLjctMjQgMjR2MTZjMCAxMy4zIDEwLjcgMjQgMjQgMjRoMTgyLjZsLTc1LjUgNzIuNGMtOS43IDkuMy05LjkgMjQuOC0uNCAzNC4zbDExIDEwLjljOS40IDkuNCAyNC42IDkuNCAzMy45IDBMNDA0LjMgMjczYzkuNC05LjQgOS40LTI0LjYgMC0zMy45TDI3MS42IDEwNi4zYy05LjQtOS40LTI0LjYtOS40LTMzLjkgMGwtMTEgMTAuOWMtOS41IDkuNi05LjMgMjUuMS40IDM0LjR6IiAvPjwvc3ZnPg==" class="icon" />

### Choose address selection strategy.

EmailEngine can either use the default address, assign a static address for each account or select a random address every time a new connection to an email server is made.

<img src="data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSIjMDAwIiBoZWlnaHQ9IjI0IiB3aWR0aD0iMjQiIHZpZXdib3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNMjU2IDhjMTM3IDAgMjQ4IDExMSAyNDggMjQ4UzM5MyA1MDQgMjU2IDUwNCA4IDM5MyA4IDI1NiAxMTkgOCAyNTYgOHptLTI4LjkgMTQzLjZsNzUuNSA3Mi40SDEyMGMtMTMuMyAwLTI0IDEwLjctMjQgMjR2MTZjMCAxMy4zIDEwLjcgMjQgMjQgMjRoMTgyLjZsLTc1LjUgNzIuNGMtOS43IDkuMy05LjkgMjQuOC0uNCAzNC4zbDExIDEwLjljOS40IDkuNCAyNC42IDkuNCAzMy45IDBMNDA0LjMgMjczYzkuNC05LjQgOS40LTI0LjYgMC0zMy45TDI3MS42IDEwNi4zYy05LjQtOS40LTI0LjYtOS40LTMzLjkgMGwtMTEgMTAuOWMtOS41IDkuNi05LjMgMjUuMS40IDM0LjR6IiAvPjwvc3ZnPg==" class="icon" />

### Set up address pool.

EmailEngine provides you with a list of IP addresses it can use. Check all addresses that are valid for your use case. If you happen to remove an address that is used as a static address for some accounts, then no need to worry – EmailEngine will automatically pick another one.

<img src="data:image/svg+xml;base64,PHN2ZyB2aWV3Ym94PSIwIDAgOTQwIDYyMyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBjbGFzcz0icGR4QnJvd3NlciI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cmVjdCBmaWxsPSIjRkZGIiB3aWR0aD0iOTQwIiBoZWlnaHQ9IjYyMyIgcng9IjkiIC8+PHBhdGggZD0iTTAgMzZoOTQwVjlhOSA5IDAgMCAwLTktOUg5YTkgOSAwIDAgMC05IDl2Mjd6IiBmaWxsPSIjREZFMUU2IiAvPjxjaXJjbGUgZmlsbD0iI0ZENjE1NyIgY3g9IjE4IiBjeT0iMTgiIHI9IjYiPjwvY2lyY2xlPjxjaXJjbGUgZmlsbD0iI0ZEQkQwNCIgY3g9IjM4IiBjeT0iMTgiIHI9IjYiPjwvY2lyY2xlPjxjaXJjbGUgZmlsbD0iIzMwQ0EyRSIgY3g9IjU4IiBjeT0iMTgiIHI9IjYiPjwvY2lyY2xlPjwvZz48L3N2Zz4=" class="pdxBrowser" />

<img src="lib_pTNsKLAHHUZrxQKE/ujbyvmvifcjqdbv7.png?w=800&amp;h=500&amp;fit=crop" srcset="lib_pTNsKLAHHUZrxQKE/ujbyvmvifcjqdbv7.png?w=800&amp;h=500&amp;fit=crop, lib_pTNsKLAHHUZrxQKE/ujbyvmvifcjqdbv7.png?w=800&amp;h=500&amp;fit=crop&amp;dpr=2 2x" />

## Proxies as an alternative

In addition to local addresses, you can route all your connections through proxy servers. The email server would see the proxy server's IP address as the client IP.

EmailEngine supports HTTP [CONNECT](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT)-based proxies and SOCKS proxies (versions 4 and 5).

The format of the Proxy URL is the following:

    proxytype://username:password@server:port

Example HTTP proxy with username and password (if the server is using a standard HTTP or HTTPS port, then you do not have to specify it):

    http://andris:verysecret@proxy.example.com

Example SOCKS5 proxy url:

    socks5://proxy.example.com:1080

### Option 1 – global proxy

On the same network configuration page, as shown above, you can also set up a global proxy. In that case, all connections, both for IMAP and SMTP, would be proxied through this specific proxy server. This is primarily useful when your network is private, and you have to make requests through a dedicated proxy server with a public interface.

### Option 2 – account specific proxies

Another option is to set up account-specific proxies. When [creating](https://api.emailengine.app/#operation/postV1Account) or [updating](https://api.emailengine.app/#operation/putV1AccountAccount) an account, use the `proxy` property that takes the proxy URL as its value.

The following example sets up the account to make all IMAP/SMTP connections for that account through a proxy server at `socks5://proxy.example.com:1080`

    curl -XPOST "http://127.0.0.1:3000/v1/account" \
        -H "Authorization: Bearer f77cf263b70488..." \
        -H "Content-type: application/json" \
        -d '{
          "account": "example",
          "name": "Andris Reinman",
          "email": "andris@example.com",
          "proxy": "socks5://proxy.example.com:1080",
          "imap": {
            "auth": {
              "user": "andris",
              "pass": "sercretpass"
            },
            "host": "mail.example.com",
            "port": 993,
            "secure": true
          },
          "smtp": {
            "auth": {
              "user": "andris",
              "pass": "secretpass"
            },
            "host": "mail.example.com",
            "port": 465,
            "secure": true
          }
        }'

© 2021-2025 Postal Systems OÜ

[Terms of Service](https://postalsys.com/tos)[Privacy Policy](/privacy-policy)[About](/about)[EmailEngine License](https://emailengine.dev/license.md)

- <a href="https://twitter.com/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzc4IiBoZWlnaHQ9IjM4NyIgdmlld2JveD0iMCAwIDM3OCAzODciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIyMS4xODEgMTc0LjAwM0wzNDUuMTQ3IDMzSDMxNS43NzFMMjA4LjEzIDE1NS40MzFMMTIyLjE1OSAzM0gyM0wxNTMuMDA2IDIxOC4xMzdMMjMgMzY2SDUyLjM3NzVMMTY2LjA0OCAyMzYuNzA5TDI1Ni44NDEgMzY2SDM1NkwyMjEuMTczIDE3NC4wMDNIMjIxLjE4SDIyMS4xODFaTTE4MC45NDMgMjE5Ljc2OEwxNjcuNzcxIDIwMS4zMzJMNjIuOTYzMyA1NC42Mzk5SDEwOC4wODZMMTkyLjY2NyAxNzMuMDI2TDIwNS44MzkgMTkxLjQ2MkwzMTUuNzg1IDM0NS4zNDVIMjcwLjY2MkwxODAuOTQzIDIxOS43NzVWMjE5Ljc2OFoiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz48L3N2Zz4=" /></a>
- <a href="https://github.com/postalsys/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCA0OTYgNTEyIj48cGF0aCBkPSJNMTY1LjkgMzk3LjRjMCAyLTIuMyAzLjYtNS4yIDMuNi0zLjMuMy01LjYtMS4zLTUuNi0zLjYgMC0yIDIuMy0zLjYgNS4yLTMuNiAzLS4zIDUuNiAxLjMgNS42IDMuNnptLTMxLjEtNC41Yy0uNyAyIDEuMyA0LjMgNC4zIDQuOSAyLjYgMSA1LjYgMCA2LjItMnMtMS4zLTQuMy00LjMtNS4yYy0yLjYtLjctNS41LjMtNi4yIDIuM3ptNDQuMi0xLjdjLTIuOS43LTQuOSAyLjYtNC42IDQuOS4zIDIgMi45IDMuMyA1LjkgMi42IDIuOS0uNyA0LjktMi42IDQuNi00LjYtLjMtMS45LTMtMy4yLTUuOS0yLjl6TTI0NC44IDhDMTA2LjEgOCAwIDExMy4zIDAgMjUyYzAgMTEwLjkgNjkuOCAyMDUuOCAxNjkuNSAyMzkuMiAxMi44IDIuMyAxNy4zLTUuNiAxNy4zLTEyLjEgMC02LjItLjMtNDAuNC0uMy02MS40IDAgMC03MCAxNS04NC43LTI5LjggMCAwLTExLjQtMjkuMS0yNy44LTM2LjYgMCAwLTIyLjktMTUuNyAxLjYtMTUuNCAwIDAgMjQuOSAyIDM4LjYgMjUuOCAyMS45IDM4LjYgNTguNiAyNy41IDcyLjkgMjAuOSAyLjMtMTYgOC44LTI3LjEgMTYtMzMuNy01NS45LTYuMi0xMTIuMy0xNC4zLTExMi4zLTExMC41IDAtMjcuNSA3LjYtNDEuMyAyMy42LTU4LjktMi42LTYuNS0xMS4xLTMzLjMgMi42LTY3LjkgMjAuOS02LjUgNjkgMjcgNjkgMjcgMjAtNS42IDQxLjUtOC41IDYyLjgtOC41czQyLjggMi45IDYyLjggOC41YzAgMCA0OC4xLTMzLjYgNjktMjcgMTMuNyAzNC43IDUuMiA2MS40IDIuNiA2Ny45IDE2IDE3LjcgMjUuOCAzMS41IDI1LjggNTguOSAwIDk2LjUtNTguOSAxMDQuMi0xMTQuOCAxMTAuNSA5LjIgNy45IDE3IDIyLjkgMTcgNDYuNCAwIDMzLjctLjMgNzUuNC0uMyA4My42IDAgNi41IDQuNiAxNC40IDE3LjMgMTIuMUM0MjguMiA0NTcuOCA0OTYgMzYyLjkgNDk2IDI1MiA0OTYgMTEzLjMgMzgzLjUgOCAyNDQuOCA4ek05Ny4yIDM1Mi45Yy0xLjMgMS0xIDMuMy43IDUuMiAxLjYgMS42IDMuOSAyLjMgNS4yIDEgMS4zLTEgMS0zLjMtLjctNS4yLTEuNi0xLjYtMy45LTIuMy01LjItMXptLTEwLjgtOC4xYy0uNyAxLjMuMyAyLjkgMi4zIDMuOSAxLjYgMSAzLjYuNyA0LjMtLjcuNy0xLjMtLjMtMi45LTIuMy0zLjktMi0uNi0zLjYtLjMtNC4zLjd6bTMyLjQgMzUuNmMtMS42IDEuMy0xIDQuMyAxLjMgNi4yIDIuMyAyLjMgNS4yIDIuNiA2LjUgMSAxLjMtMS4zLjctNC4zLTEuMy02LjItMi4yLTIuMy01LjItMi42LTYuNS0xem0tMTEuNC0xNC43Yy0xLjYgMS0xLjYgMy42IDAgNS45IDEuNiAyLjMgNC4zIDMuMyA1LjYgMi4zIDEuNi0xLjMgMS42LTMuOSAwLTYuMi0xLjQtMi4zLTQtMy4zLTUuNi0yeiIgZmlsbD0iY3VycmVudENvbG9yIiAvPjwvc3ZnPg==" /></a>
