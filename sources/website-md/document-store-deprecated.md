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

<a href="https://postalsys.com/plans" id="btn_mjhvty9ysd" class="btn primary" target="_blank" rel="noopener noreferrer">Get a license key<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMWVtIiB2aWV3Ym94PSIwIDAgMTUgMTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkuNiA3SDFhMSAxIDAgMSAxIDAtMmg4LjZMNyAyLjRBMSAxIDAgMCAxIDguNCAxbDQuMyA0LjJjLjIuMy4zLjUuMy44IDAgLjMtLjEuNS0uMy43TDguNCAxMUExIDEgMCAxIDEgNyA5LjVMOS42IDd6IiBmaWxsPSJjdXJyZW50Q29sb3IiIC8+PC9zdmc+" /></a>

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

# Document Store

Syncing emails to ElasticSearch

EmailEngine has an optional feature to sync all emails to a local document store backend. Currently, only ElasticSearch can be used as such a backend.

> EmailEngine supports ElasticSearch 8+. Older versions of ElasticSearch and otherwise compatible software like OpenSearch are not supported.

If the document store syncing is enabled, EmailEngine copies email contents for all new emails (excluding attachments) to ElasticSearch as email documents.

Whenever you request message listings or want to search for messages, EmailEngine would use ElasticSearch as the source of the data instead of the actual IMAP account. This approach has many upsides:

1.  ElaticSearch is not rate-limited. You can run as many requests as your servers can handle. With IMAP, you always need to consider that requests against a single email account can be processed serially, not in parallel, and each such request takes time.
2.  As the stored email document looks the same as what you'd get from the IMAP server with the message details API request, you can skip EmailEngine entirely and run your requests against ElasticSearch directly. This would enable aggregations and grouping that are not supported by EmailEngine natively.

## Enabling the Document Store

### 

1.  Navigate to Configuration and Document Store.
2.  Fill required connection details
3.  Open the hamburger menu from the top right and select "test connection"
4.  If the connection test succeeded, mark the "Enable syncing" checkbox and save changes

<img src="data:image/svg+xml;base64,PHN2ZyB2aWV3Ym94PSIwIDAgOTQwIDYyMyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBjbGFzcz0icGR4QnJvd3NlciI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cmVjdCBmaWxsPSIjRkZGIiB3aWR0aD0iOTQwIiBoZWlnaHQ9IjYyMyIgcng9IjkiIC8+PHBhdGggZD0iTTAgMzZoOTQwVjlhOSA5IDAgMCAwLTktOUg5YTkgOSAwIDAgMC05IDl2Mjd6IiBmaWxsPSIjREZFMUU2IiAvPjxjaXJjbGUgZmlsbD0iI0ZENjE1NyIgY3g9IjE4IiBjeT0iMTgiIHI9IjYiPjwvY2lyY2xlPjxjaXJjbGUgZmlsbD0iI0ZEQkQwNCIgY3g9IjM4IiBjeT0iMTgiIHI9IjYiPjwvY2lyY2xlPjxjaXJjbGUgZmlsbD0iIzMwQ0EyRSIgY3g9IjU4IiBjeT0iMTgiIHI9IjYiPjwvY2lyY2xlPjwvZz48L3N2Zz4=" class="pdxBrowser" />

<img src="lib_pTNsKLAHHUZrxQKE/56usbi9sdq6zeq8h.png?w=800&amp;h=500&amp;fit=crop" srcset="lib_pTNsKLAHHUZrxQKE/56usbi9sdq6zeq8h.png?w=800&amp;h=500&amp;fit=crop, lib_pTNsKLAHHUZrxQKE/56usbi9sdq6zeq8h.png?w=800&amp;h=500&amp;fit=crop&amp;dpr=2 2x" alt="Screenshot 2022-12-15 at 14.03.43.png" />

Once the Document Store is set up and enabled, EmailEngine starts syncing all new emails for existing accounts and all emails for new accounts to ElasticSearch. As it takes time to process each email, it might take a long time to process larger email accounts.

> Existing emails for an account are synced only if the account is added to EmailEngine while the Document Store syncing is enabled.

## Making requests against the Document Store

By default, when making API requests, EmailEngine will still use IMAP as the backend, even if the Document Store has been enabled. To force EmailEngine to use the Document Store, add a GET query argument `documentStore=true` to all API requests.

Document Store is only available for regular read requests, such as listing or searching messages. If you want to fetch attachments or update flags for messages, these requests will always go against the IMAP server.

> Requests against the Document Store do not require setting the path option. Unlike with IMAP, where you can only search for emails from a specific folder, Document Store allows you to search all messages from the entire account.

The following example searches for unseen emails from the entire account (`path` is not set for the request):

    curl -XPOST -s "http://example.com/v1/account/example/search?documentStore=true" \
        -H "Authorization: Bearer test123" \
        -H "Content-type: application/json" \
        -d '{
      "search": {
        "unseen": true
      }
    }'

## Custom search terms

With searches against the Document Store, you can use an additional filtering option called `documentQuery`. This is a search object structure that EmailEngine would pass directly to ElasticSearch when running the query. The custom query would be merged with regular search options, so you'd still have to provide the search query object, but you can leave it empty.

The following example searches for unseen emails with attachments. IMAP searches do not allow searching for attachments, but in ElasticSearch, it is possible. Note, though, that the attachment field is stored as a nested document, so the query must be built as a nested query as well. This is why the resulting query looks quite complicated.

All attachments have an `"id"` property, so the query matches any document with `attachment.id` property set.

    curl -XPOST -s "http://example.com/v1/account/example/search?documentStore=true" \
        -H "Authorization: Bearer test123" \
        -H "Content-type: application/json" \
        -d '{
      "search": {
        "unseen": true
      },
      "documentQuery": {
        "nested": {
          "path": "attachments",
          "query": {
            "bool": {
              "must": [
                {
                  "exists": {
                    "field": "attachments.id"
                  }
                }
              ]
            }
          }
        }
      }
    }'

> Note that the query is basically a filter. This means you can only use filtering terms but not anything more advanced like aggregations or grouping. You'd have to run your queries against the ElasticsEarch server directly for these types of queries.

## Filtering and pre-processing

In the Document Store configuration page, there is a tab called "Pre-processing". This allows you to filter and modify email contents before these are synced to the Document Store.

Message pre-processing consists of two components.

#### Filtering function

First is the filtering function. This is a tiny program written in Javascript. The function takes the email payload as an argument and returns if the email should be synced or not based on that input.

The following example filter skips all emails for the account "example". These emails are not synced to the Document Store.

    if(payload.account === "example"){
        return false;
    }
    return true;

#### Mapping function

Second is the mapping function. It takes the email payload and morphs it into the required output structure for syncing. Mapping is mostly useful for adding new fields, or removing PII data from existing fields. This function is also a JavaScript code, just like the filtering function. Whatever the function returns will be synced to the Document Store. Protected fields like `id`, `account` and `path` can not be modified and will be always included as part of the output.

The following example adds a new field called `type` to the synced email.

    payload.type = 'email';
    return payload;

> **NB!** If you add additional fields to synced emails, you probably should create a field type mappings for these fields first. Otherwise, ElasticSearch generates the type mapping dynamically itself, and it might not be what you expect.

## Field mappings

### 

The field mappings page in the Document Store settings allows you to define additional field type mappings for email documents stored in ElasticSearch.

### 

EmailEngine automatically maps types for all the fields it uses. For other fields, for example, the custom fields added with the Document Store pre-processing functions, EmailEngine does not set any type mappings.

### 

Sometimes it is fine to let ElasticSearch handle types automatically, as the dynamic mapper is good enough. Not always, though.

<img src="data:image/svg+xml;base64,PHN2ZyB2aWV3Ym94PSIwIDAgOTQwIDYyMyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBjbGFzcz0icGR4QnJvd3NlciI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cmVjdCBmaWxsPSIjRkZGIiB3aWR0aD0iOTQwIiBoZWlnaHQ9IjYyMyIgcng9IjkiIC8+PHBhdGggZD0iTTAgMzZoOTQwVjlhOSA5IDAgMCAwLTktOUg5YTkgOSAwIDAgMC05IDl2Mjd6IiBmaWxsPSIjREZFMUU2IiAvPjxjaXJjbGUgZmlsbD0iI0ZENjE1NyIgY3g9IjE4IiBjeT0iMTgiIHI9IjYiPjwvY2lyY2xlPjxjaXJjbGUgZmlsbD0iI0ZEQkQwNCIgY3g9IjM4IiBjeT0iMTgiIHI9IjYiPjwvY2lyY2xlPjxjaXJjbGUgZmlsbD0iIzMwQ0EyRSIgY3g9IjU4IiBjeT0iMTgiIHI9IjYiPjwvY2lyY2xlPjwvZz48L3N2Zz4=" class="pdxBrowser" />

<img src="lib_pTNsKLAHHUZrxQKE/ct4v6crkagc53w9r.png?w=800&amp;h=500&amp;fit=crop" srcset="lib_pTNsKLAHHUZrxQKE/ct4v6crkagc53w9r.png?w=800&amp;h=500&amp;fit=crop, lib_pTNsKLAHHUZrxQKE/ct4v6crkagc53w9r.png?w=800&amp;h=500&amp;fit=crop&amp;dpr=2 2x" alt="Screenshot 2022-12-15 at 17.05.33.png" />

> **NB!** Beware, once a field mapping has been set, you can't modify it unless you migrate the entire index. The same applies to dynamically mapped fields – if ElasticSearch finds a field value without a type mapping, it will set it dynamically, and you can't modify that type later. So define any mappings you want to use before storing data in ElasticSearch.

EmailEngine allows you to create basic types only. For example, keywords, numbers, etc. For more complex object types, you would have to manage these manually.

You can generate new field mappings using *curl* like this:

    curl -XPUT -k "https://localhost:9200/emailengine/_mapping?pretty=true" \
      -u "elastic:PASSWORD" \
      -H "Content-type: application/json" \
      -d '{
        "properties": {
          "type": {
            "type": "keyword",
            "ignore_above" : 128
          }
        }
      }'

Read more about it [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/explicit-mapping.md).

© 2021-2025 Postal Systems OÜ

[Terms of Service](https://postalsys.com/tos)[Privacy Policy](/privacy-policy)[About](/about)[EmailEngine License](https://emailengine.dev/license.md)

- <a href="https://twitter.com/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzc4IiBoZWlnaHQ9IjM4NyIgdmlld2JveD0iMCAwIDM3OCAzODciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIyMS4xODEgMTc0LjAwM0wzNDUuMTQ3IDMzSDMxNS43NzFMMjA4LjEzIDE1NS40MzFMMTIyLjE1OSAzM0gyM0wxNTMuMDA2IDIxOC4xMzdMMjMgMzY2SDUyLjM3NzVMMTY2LjA0OCAyMzYuNzA5TDI1Ni44NDEgMzY2SDM1NkwyMjEuMTczIDE3NC4wMDNIMjIxLjE4SDIyMS4xODFaTTE4MC45NDMgMjE5Ljc2OEwxNjcuNzcxIDIwMS4zMzJMNjIuOTYzMyA1NC42Mzk5SDEwOC4wODZMMTkyLjY2NyAxNzMuMDI2TDIwNS44MzkgMTkxLjQ2MkwzMTUuNzg1IDM0NS4zNDVIMjcwLjY2MkwxODAuOTQzIDIxOS43NzVWMjE5Ljc2OFoiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz48L3N2Zz4=" /></a>
- <a href="https://github.com/postalsys/emailengine" class="color-2" target="_blank" rel="noreferer noopener"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCA0OTYgNTEyIj48cGF0aCBkPSJNMTY1LjkgMzk3LjRjMCAyLTIuMyAzLjYtNS4yIDMuNi0zLjMuMy01LjYtMS4zLTUuNi0zLjYgMC0yIDIuMy0zLjYgNS4yLTMuNiAzLS4zIDUuNiAxLjMgNS42IDMuNnptLTMxLjEtNC41Yy0uNyAyIDEuMyA0LjMgNC4zIDQuOSAyLjYgMSA1LjYgMCA2LjItMnMtMS4zLTQuMy00LjMtNS4yYy0yLjYtLjctNS41LjMtNi4yIDIuM3ptNDQuMi0xLjdjLTIuOS43LTQuOSAyLjYtNC42IDQuOS4zIDIgMi45IDMuMyA1LjkgMi42IDIuOS0uNyA0LjktMi42IDQuNi00LjYtLjMtMS45LTMtMy4yLTUuOS0yLjl6TTI0NC44IDhDMTA2LjEgOCAwIDExMy4zIDAgMjUyYzAgMTEwLjkgNjkuOCAyMDUuOCAxNjkuNSAyMzkuMiAxMi44IDIuMyAxNy4zLTUuNiAxNy4zLTEyLjEgMC02LjItLjMtNDAuNC0uMy02MS40IDAgMC03MCAxNS04NC43LTI5LjggMCAwLTExLjQtMjkuMS0yNy44LTM2LjYgMCAwLTIyLjktMTUuNyAxLjYtMTUuNCAwIDAgMjQuOSAyIDM4LjYgMjUuOCAyMS45IDM4LjYgNTguNiAyNy41IDcyLjkgMjAuOSAyLjMtMTYgOC44LTI3LjEgMTYtMzMuNy01NS45LTYuMi0xMTIuMy0xNC4zLTExMi4zLTExMC41IDAtMjcuNSA3LjYtNDEuMyAyMy42LTU4LjktMi42LTYuNS0xMS4xLTMzLjMgMi42LTY3LjkgMjAuOS02LjUgNjkgMjcgNjkgMjcgMjAtNS42IDQxLjUtOC41IDYyLjgtOC41czQyLjggMi45IDYyLjggOC41YzAgMCA0OC4xLTMzLjYgNjktMjcgMTMuNyAzNC43IDUuMiA2MS40IDIuNiA2Ny45IDE2IDE3LjcgMjUuOCAzMS41IDI1LjggNTguOSAwIDk2LjUtNTguOSAxMDQuMi0xMTQuOCAxMTAuNSA5LjIgNy45IDE3IDIyLjkgMTcgNDYuNCAwIDMzLjctLjMgNzUuNC0uMyA4My42IDAgNi41IDQuNiAxNC40IDE3LjMgMTIuMUM0MjguMiA0NTcuOCA0OTYgMzYyLjkgNDk2IDI1MiA0OTYgMTEzLjMgMzgzLjUgOCAyNDQuOCA4ek05Ny4yIDM1Mi45Yy0xLjMgMS0xIDMuMy43IDUuMiAxLjYgMS42IDMuOSAyLjMgNS4yIDEgMS4zLTEgMS0zLjMtLjctNS4yLTEuNi0xLjYtMy45LTIuMy01LjItMXptLTEwLjgtOC4xYy0uNyAxLjMuMyAyLjkgMi4zIDMuOSAxLjYgMSAzLjYuNyA0LjMtLjcuNy0xLjMtLjMtMi45LTIuMy0zLjktMi0uNi0zLjYtLjMtNC4zLjd6bTMyLjQgMzUuNmMtMS42IDEuMy0xIDQuMyAxLjMgNi4yIDIuMyAyLjMgNS4yIDIuNiA2LjUgMSAxLjMtMS4zLjctNC4zLTEuMy02LjItMi4yLTIuMy01LjItMi42LTYuNS0xem0tMTEuNC0xNC43Yy0xLjYgMS0xLjYgMy42IDAgNS45IDEuNiAyLjMgNC4zIDMuMyA1LjYgMi4zIDEuNi0xLjMgMS42LTMuOSAwLTYuMi0xLjQtMi4zLTQtMy4zLTUuNi0yeiIgZmlsbD0iY3VycmVudENvbG9yIiAvPjwvc3ZnPg==" /></a>
