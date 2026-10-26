---
title: Documentation MCP Server
sidebar_label: Documentation Server
sidebar_position: 6
description: Connect Claude or another MCP client to mcp.emailengine.app to search the EmailEngine documentation, API reference and source code while you configure an instance
---

# Documentation MCP Server

`https://mcp.emailengine.app` is a public MCP server that gives an AI client read-only access to the EmailEngine documentation, the REST API reference and the EmailEngine source code. Connect it to Claude, Cursor or any other MCP client, and the agent can look up exact settings, environment variables, defaults and API fields while it helps you install, configure or troubleshoot an instance.

This is a different server from the [MCP endpoint every EmailEngine instance serves](/docs/mcp):

| | Documentation server | Your instance's MCP endpoint |
|---|---|---|
| Address | `https://mcp.emailengine.app` | `https://your-instance/mcp` |
| Run by | Postal Systems | You, as part of EmailEngine |
| Reaches | Public documentation, API reference and source code | The mailboxes and settings of your instance |
| Authentication | None | An EmailEngine access token or OAuth sign-in |
| Can change anything | No, every tool is read-only | Yes, depending on the token's access level |

The documentation server never connects to your instance and cannot see your accounts, settings, tokens or licence. Connect both when you want an agent that can read the docs and act on your instance.

## Connect a client

The server needs no account, token or API key.

**Claude Code:**

```bash
claude mcp add --transport http emailengine-docs https://mcp.emailengine.app
```

**claude.ai and Claude Desktop:** add a custom connector with the name "EmailEngine docs" and the remote MCP server URL `https://mcp.emailengine.app`. Leave the OAuth client fields empty.

**JSON configuration** (Cursor, project-level `.mcp.json` files and most clients configured through a file):

```json
{
  "mcpServers": {
    "emailengine-docs": {
      "type": "http",
      "url": "https://mcp.emailengine.app"
    }
  }
}
```

Any client that speaks Streamable HTTP works the same way. Opening the address in a browser redirects to this documentation site.

## Tools

All five tools are read-only lookups and are annotated with `readOnlyHint`.

| Tool | Arguments | Returns |
|------|-----------|---------|
| `search_docs` | `query` (string) | Up to six matching sections of the documentation, the API reference, the emailengine.app pages and the account, licence and support notes, each with its title, section heading, link and an excerpt of up to 1,500 characters |
| `read_page` | `url` (string) | One whole page by a URL that `search_docs` returned, up to 15,000 characters. Any `#fragment` is ignored |
| `get_api_operation` | `method` (`GET`, `POST`, `PUT`, `PATCH` or `DELETE`), `path` (string) | Parameters, request body fields and response fields of one REST operation, for example `POST` `/v1/account/{account}/submit`. An unknown path returns the names of similar operations |
| `search_code` | `terms` (string), `path_prefix` (string, optional) | Lines of the EmailEngine source that contain all the given terms, case-insensitive, with file and line number. At most six terms and 30 lines are used, and the result names the release it searched |
| `read_source` | `path` (string), `start_line` (integer), `end_line` (integer) | Up to 300 numbered lines of one source file, by a path that `search_code` returned |

`search_docs` works best with several short keyword queries, such as `webhook signature serviceSecret`, rather than one long sentence. `search_code` is the way to find environment variables (`EENGINE_*`), setting names and defaults that the documentation does not state.

The server also returns short usage instructions in its `initialize` response, describing which tool to use for what.

## What the server knows

- The pages of this documentation site, from its sitemap
- The REST API reference, from the OpenAPI spec of the latest EmailEngine release
- The source code of the latest EmailEngine release
- The public pages of emailengine.app

The index is rebuilt every six hours, so it can lag a documentation change or a new release by that long. The source code and the API reference always describe the latest release. If your instance runs an older version, tell the agent which version you have, and check behavior that changed between releases in the [changelog](https://github.com/postalsys/emailengine/blob/master/CHANGELOG.md).

## Example

With both servers connected, a request like the following lets the agent combine them:

> Send new-message webhooks from my EmailEngine instance to https://example.com/webhooks.

The agent searches the documentation server for webhook configuration and finds the settings involved: `webhooksEnabled`, `webhooks` and `webhookEvents`. It then calls `update_settings` on your instance's MCP endpoint, which needs a token with the Operate management level or higher. EmailEngine tells management agents to confirm with you before changing where webhooks are delivered. Without the instance endpoint connected, the agent explains the settings and leaves the change to you.

## Limits

- Each IP address can make 600 requests per hour, and each /24 IPv4 range or /64 IPv6 range 1,800. A request over the limit receives HTTP `429` with a JSON-RPC error.
- The server is stateless. It does not open a server-to-client event stream, so `GET` requests with `Accept: text/event-stream` receive `405`.
- Requests that carry a browser `Origin` header from a site other than this documentation site are refused, so a web page cannot call the server from a visitor's browser.
- It implements the `initialize`, `ping`, `tools/list` and `tools/call` methods. It has no resources or prompts.
- Supported protocol versions: `2025-11-25`, `2025-06-18`, `2025-03-26` and `2024-11-05`.

## Privacy

The server stores how many times each tool was called per day. It does not store the queries, the tool arguments or the results. Tool calls do not pass through any language model on the Postal Systems side: the model that reads the results is the one in your client.

## See Also

- [Model Context Protocol (MCP)](/docs/mcp) - the MCP endpoint of your own EmailEngine instance
- [Connecting Agents](/docs/mcp/connect-clients) - connect a client to your instance's endpoint
- [AI Agent Reference](/docs/reference/llm-context) - a condensed API overview written for AI coding assistants
