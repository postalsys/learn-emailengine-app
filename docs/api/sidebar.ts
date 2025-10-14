import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "api/emailengine-api",
    },
    {
      type: "category",
      label: "Account",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-accounts",
          label: "List accounts",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-v-1-changes",
          label: "Stream state changes",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-v-1-account-account",
          label: "Get account info",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/delete-v-1-account-account",
          label: "Remove account",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "api/put-v-1-account-account",
          label: "Update account info",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/get-v-1-account-account-oauthtoken",
          label: "Get OAuth2 access token",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-v-1-account-account-serversignatures",
          label: "List Account Signatures",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/post-v-1-account",
          label: "Register new account",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/post-v-1-verifyaccount",
          label: "Verify IMAP and SMTP settings",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/post-v-1-authentication-form",
          label: "Generate authentication link",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/put-v-1-account-account-sync",
          label: "Request syncing",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/put-v-1-account-account-reconnect",
          label: "Request reconnect",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/put-v-1-account-account-flush",
          label: "Request account flush",
          className: "api-method put",
        },
      ],
    },
    {
      type: "category",
      label: "Mailbox",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-account-account-mailboxes",
          label: "List mailboxes",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/post-v-1-account-account-mailbox",
          label: "Create mailbox",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/delete-v-1-account-account-mailbox",
          label: "Delete mailbox",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "api/put-v-1-account-account-mailbox",
          label: "Modify mailbox",
          className: "api-method put",
        },
      ],
    },
    {
      type: "category",
      label: "Message",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-account-account-messages",
          label: "List messages in a folder",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-v-1-account-account-text-text",
          label: "Retrieve message text",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-v-1-account-account-attachment-attachment",
          label: "Download attachment",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-v-1-account-account-message-message",
          label: "Get message information",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/delete-v-1-account-account-message-message",
          label: "Delete message",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "api/put-v-1-account-account-message-message",
          label: "Update message",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/get-v-1-account-account-message-message-source",
          label: "Download raw message",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/post-v-1-account-account-message",
          label: "Upload message",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/post-v-1-account-account-search",
          label: "Search for messages",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/put-v-1-account-account-message-message-move",
          label: "Move a message to a specified folder",
          className: "api-method put",
        },
      ],
    },
    {
      type: "category",
      label: "Submit",
      items: [
        {
          type: "doc",
          id: "api/post-v-1-account-account-submit",
          label: "Submit message for delivery",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Outbox",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-outbox",
          label: "List queued messages",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-v-1-outbox-queueid",
          label: "Get queued message",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/delete-v-1-outbox-queueid",
          label: "Remove a message",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Delivery Test",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-deliverytest-check-deliverytest",
          label: "Check test status",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/post-v-1-deliverytest-account-account",
          label: "Create delivery test",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Access Tokens",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-tokens",
          label: "List root tokens",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-v-1-tokens-account-account",
          label: "List account tokens",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/post-v-1-token",
          label: "Provision an access token",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/delete-v-1-token-token",
          label: "Remove a token",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Settings",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-autoconfig",
          label: "Discover Email settings",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-v-1-settings",
          label: "List specific settings",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/post-v-1-settings",
          label: "Set setting values",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/get-v-1-settings-queue-queue",
          label: "Show queue information",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/put-v-1-settings-queue-queue",
          label: "Set queue settings",
          className: "api-method put",
        },
      ],
    },
    {
      type: "category",
      label: "Templates",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-templates",
          label: "List account templates",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-v-1-templates-template-template",
          label: "Get template information",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/delete-v-1-templates-template-template",
          label: "Remove a template",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "api/put-v-1-templates-template-template",
          label: "Update a template",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/post-v-1-templates-template",
          label: "Create template",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/delete-v-1-templates-account-account",
          label: "Flush templates",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Logs",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-logs-account",
          label: "Return IMAP logs for an account",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Stats",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-stats",
          label: "Return server stats",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "License",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-license",
          label: "Request license info",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/post-v-1-license",
          label: "Register a license",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/delete-v-1-license",
          label: "Remove license",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Webhooks",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-webhookroutes",
          label: "List webhook routes",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-v-1-webhookroutes-webhookroute-webhookroute",
          label: "Get webhook route information",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "OAuth2 Applications",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-oauth-2",
          label: "List OAuth2 applications",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/post-v-1-oauth-2",
          label: "Register OAuth2 application",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/get-v-1-oauth-2-app",
          label: "Get application info",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/delete-v-1-oauth-2-app",
          label: "Remove OAuth2 application",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "api/put-v-1-oauth-2-app",
          label: "Update OAuth2 application",
          className: "api-method put",
        },
      ],
    },
    {
      type: "category",
      label: "SMTP Gateway",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-gateways",
          label: "List gateways",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-v-1-gateway-gateway",
          label: "Get gateway info",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/delete-v-1-gateway-gateway",
          label: "Remove SMTP gateway",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "api/post-v-1-gateway",
          label: "Register new gateway",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/put-v-1-gateway-edit-gateway",
          label: "Update gateway info",
          className: "api-method put",
        },
      ],
    },
    {
      type: "category",
      label: "Blocklists",
      items: [
        {
          type: "doc",
          id: "api/get-v-1-blocklists",
          label: "List blocklists",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-v-1-blocklist-listid",
          label: "List blocklist entries",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/post-v-1-blocklist-listid",
          label: "Add to blocklist",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/delete-v-1-blocklist-listid",
          label: "Remove from blocklist",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Multi Message Actions",
      items: [
        {
          type: "doc",
          id: "api/put-v-1-account-account-messages",
          label: "Update messages",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/put-v-1-account-account-messages-move",
          label: "Move messages",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/put-v-1-account-account-messages-delete",
          label: "Delete messages",
          className: "api-method put",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
