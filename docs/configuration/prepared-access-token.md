---
title: Prepared Access Token
sidebar_position: 7
---

EmailEngine only allows API requests to be made [using a valid access token](/authenticating-api-requests). While it is generally straightforward to generate such a token – all you need to do is log in to the admin interface of EmailEngine and click on the "Generate token" button – this approach still requires some manual work. In some situations, we want things to be completely automated. For example, when setting up a complex Docker-based architecture, we might want to perform some API requests before visiting the web interface; or doing end-to-end automated testing.
We can use the EmailEngine CLI to handle access tokens in these cases.
### Issuing tokens
The first option is to generate a new token via CLI. Make sure to use the same database configuration arguments as your main EmailEngine application has. Otherwise, EmailEngine would insert that token into the wrong database.
```
$ emailengine tokens issue -d "my token" -s "*" --dbs.redis="redis://127.0.0.1:6379/8"
f05d76644ea39c4a2ee33e7bffe55808b716a34b51d67b388c7d60498b0f89bc
```
Where:
-   **\-d** or **\--description** is the title of the token.
-   **\-s** or **\--scope** is the scope of the token. Currently one of `"*"` for all (also the default), `"api"` for API calls, and `"metrics"` for Prometheus metrics.
-   **\-a** or **\--account** is the optional account ID if you want to bound this token against a single account. The request fails if you use the resulting token for anything unrelated to that user account.
EmailEngine returns the requested access token. We can then use it to perform API requests.
```
$ curl http://127.0.0.1/v1/stats -H 'Authorization: Bearer f05d76644ea39c4a2...'
```
> **NB!** when running token-specific CLI commands, you have to make sure that database settings are provided correctly, but you do not have to provide an encryption key in case field encryption is enabled. This is because token data is not encrypted but hashed, and thus the encryption key is never used with these values.
### Exporting tokens
If we do not want to generate a new token each time but re-use the same token, we can first create the token; it does not matter if we do it via CLI or the web interface, and then export that token using the CLI.
```
$ emailengine tokens export -t f05d76644ea39c4a2...
hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxNTYzYTFlM2I1NjVkYmEzZWJjMzk4ZjI4OWZjNjgzN...
```
Where:
-   **\-t** or **\--token** is the access token
EmailEngine returns encoded token data that we can either import to another EmailEngine instance via the CLI or use it as a predefined token set on application startup.
### Importing tokens
Importing can be done similarly to exporting; instead of providing the token value, we give the encoded token string.
> **NB!** From this point onwards, we will only be using the exported raw token data `hKJpZNlAMzAxZ...` and not the actual token `f05d76644ea39c4a2...`
```
$ emailengine tokens import -t hKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN...
Token was imported
```
Where:
-   **\-t** or **\--token** is the encoded token data you got from the export command
### Set a token on application startup
We can also load the token as a predefined value via the `EENGINE_PREPARED_TOKEN` environment variable:
```
$ export EENGINE_PREPARED_TOKEN=hhKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN...
$ emailengine
...
{"level":20,"time":1638811265629,"pid":46918,"hostname":"example.com","msg":"Imported prepared token"}
```
Or use the command-line argument `--preparedToken`:
```
$ emailengine --preparedToken="hhKJpZNlAMzAxZThjNTFhZjgxM2Q3MzUxN..."
...
{"level":20,"time":1638829642382,"pid":49817,"hostname":"example.com","msg":"Imported prepared token"}
```
You can keep both the environment variable and the command-line argument fixed. If the token is already imported, it is skipped and not imported as a duplicate the next time the application starts.