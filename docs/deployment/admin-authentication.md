---
title: Admin Authentication
sidebar_position: 8
description: How admins sign in to the EmailEngine admin interface - the admin password, TOTP two-factor authentication, passkeys, single sign-on through OpenID Connect or Okta, the login rate limits, and the audit log
---

# Admin Authentication

How an administrator signs in to the admin interface at `/admin`, and what EmailEngine records about it. Network-level controls, such as the address allowlist for `/admin` and the reverse proxy in front of it, are on [Security Best Practices](/docs/deployment/security#admin-interface-access-control); API access tokens are on [Access Tokens](/docs/api-reference/access-tokens).

## Admin Password

A fresh instance has no admin password. Until one is set, the admin interface opens without a login for anyone who can reach the port, and it refuses to issue access tokens because there is no session to tie them to. Set the password before the instance faces a network, by one of:

- **Account** > **Security** in the admin interface (the username menu in the top-right corner)
- `emailengine password` on the host, which prints a generated password or takes one with `-p`; see [Password Management](/docs/configuration/cli#password-management)
- `EENGINE_PREPARED_PASSWORD`, carrying a hash from `emailengine password --hash`, for provisioned deployments; see [Prepared Admin Password](/docs/configuration/environment-variables#prepared-admin-password)

Changing the password ends every existing admin session and deletes every registered passkey (see [Passkey Authentication](#passkey-authentication-webauthn) below). **Sign out everywhere** on the Security page ends every session without changing the password. A lost password, authenticator or passkey is recovered from the host with the CLI; see [Reset Password](/docs/configuration/reset-password).

The login form is rate limited per client address (30 attempts per minute) and per username (10 attempts per minute); a request over the limit is refused and logged as `Rate limited`.

## Two-Factor Authentication (TOTP)

A time-based one-time password (RFC 6238: SHA-1, six digits, 30-second period) can be required after the password. It is set up under **Account** > **Security** > **Two-Factor Authentication (2FA)** > **Enable 2FA**: scan the QR code with an authenticator app such as Google Authenticator or Authy, then enter the six-digit code it shows. **Disable 2FA** on the same page asks for the current password.

The code is checked against the current 30-second step and one step either side. Each code is accepted once: a code presented again within twelve minutes is refused and logged as `TOTP code recently used`. Failed codes are budgeted to 10 per minute, 20 per hour and 60 per day per user, and a session that fails five codes is ended and has to log in again.

TOTP applies to password logins only. A passkey sign-in and an SSO sign-in skip it, because the authenticator or the identity provider already supplied a second factor.

## Passkey Authentication (WebAuthn)

EmailEngine supports passkey (WebAuthn) authentication for the admin interface. Passkeys provide passwordless login using biometric sensors, hardware security keys, or platform authenticators like Touch ID and Windows Hello.

**Benefits over password authentication:**

- Phishing-resistant - passkeys are bound to the specific domain
- No passwords to remember, leak, or brute-force
- Bypasses the TOTP requirement, by design: a passkey is a single sufficient factor
- Works with platform authenticators (Touch ID, Face ID, Windows Hello) and roaming authenticators (YubiKey, Titan)

:::info Service URL Required
Passkey registration requires a configured Service URL (`serviceUrl`). The URL's hostname is used as the WebAuthn Relying Party ID. Without a Service URL, the "Add passkey" button is disabled.
:::

**Setting up passkeys:**

1. Ensure `serviceUrl` is configured in **Configuration** > **General**
2. Navigate to **Account** > **Security** (click your username in the top-right). The **Passkeys** row shows how many are registered; **Add a passkey** or **Manage passkeys** opens the passkey page, `/admin/account/passkeys`. Since v2.79.7 the list lives on that page of its own; earlier releases managed passkeys on the Security page itself
3. Click **Add passkey**
4. Enter your current password to verify your identity
5. Enter a descriptive name (e.g., "MacBook Touch ID", "YubiKey")
6. Follow your browser's WebAuthn prompt to register the authenticator

You can register up to 20 passkeys per admin user.

**Signing in with a passkey:**

1. Navigate to the admin login page
2. Click **Sign in with a passkey**
3. Follow your browser's WebAuthn prompt

Passkey authentication bypasses the TOTP requirement - if you have TOTP configured, you will not be prompted for it when signing in with a passkey.

**Managing passkeys:**

- View all registered passkeys under **Account** > **Security** > **Manage passkeys**
- Each passkey shows its name, its registration date and when it last signed in
- Remove individual passkeys using the **Remove** action on the row

:::warning Password Changes Clear Passkeys
Changing the admin password immediately deletes all registered passkeys for that user. This is a security measure to prevent unauthorized passkey-only access if the password is compromised. Re-register your passkeys after a password change.
:::

**Security details:**

- Only public keys are stored server-side - private keys never leave the authenticator device
- Registration accepts ES256 (P-256) and RS256 keys, so a passkey works on a host whose OpenSSL runs in [FIPS mode](/docs/deployment/fips-mode)
- Registration requires current password verification
- Registration and sign-in challenges expire after 5 minutes and are single-use, and since v2.79.7 each is bound to the ceremony that minted it, so a registration challenge cannot answer a sign-in
- Maximum 20 passkeys per admin user
- Registration and sign-in are each limited to 10 attempts per minute per client address
- All passkey events (registration, deletion, login success, and login failure) are logged with method, username, and IP address

## Single Sign-On (SSO)

EmailEngine supports single sign-on for the admin interface, either through any OpenID Connect provider (Keycloak, Microsoft Entra ID, Google, Authentik, and others) or through the dedicated Okta integration. When signed in through SSO, multi-factor authentication is handled by the identity provider - EmailEngine does not prompt for TOTP - and the local password, TOTP, and passkey settings cannot be managed from that session.

### OpenID Connect

**Setup:**

1. Register a confidential web application (authorization code flow) at your identity provider
2. Set the sign-in redirect URI to `{serviceUrl}/admin/login/oidc`
3. Configure the environment variables:

```bash
OIDC_ISSUER=https://keycloak.example.com/realms/main
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
# Optional: label for the sign-in button (default "SSO")
OIDC_PROVIDER_NAME=Keycloak
```

4. Restart EmailEngine

All three of `OIDC_ISSUER`, `OIDC_CLIENT_ID`, and `OIDC_CLIENT_SECRET` must be set. When enabled, a sign-in button appears on the admin login page, labeled with the provider name from `OIDC_PROVIDER_NAME`. Password login continues to work alongside SSO unless you enable SSO-only mode (see below).

At startup, EmailEngine fetches the provider's discovery document from `<issuer>/.well-known/openid-configuration`. The `issuer` value in the discovery document must exactly match `OIDC_ISSUER`. If discovery fails, for example because the identity provider is still starting or unreachable, the sign-in button is withheld and the regular password login remains available, so an identity provider outage cannot lock you out of the admin interface. Since v2.79.7 EmailEngine keeps retrying discovery in the background, five seconds after the failure and then at growing intervals up to one attempt every five minutes, and offers SSO as soon as a fetch succeeds. Up to v2.79.6 a failed startup fetch disabled SSO until the next restart.

`OIDC_SCOPES` changes the scopes requested from the provider (default `openid profile email`; `openid` is always included), for a provider that only emits group membership under an extra scope.

**Restricting who can sign in:**

By default, anyone the identity provider authenticates can access the admin interface. Use the allow-list variables to narrow this down:

```bash
# Exact emails and/or @domain entries, comma-separated
OIDC_ALLOWED_USERS=admin@example.com,@example.com

# Group names, matched against the groups claim in the userinfo response
OIDC_ALLOWED_GROUPS=emailengine-admins
# Claim that carries group membership (default "groups"); dotted paths work too
OIDC_GROUPS_CLAIM=realm_access.roles
```

A user is allowed if they match either list. The allow-lists are re-checked on every request, so removing a user from the lists (and restarting EmailEngine) also ends their existing session.

**SSO-only mode:**

Set `OIDC_FORCED=true` to make SSO the only way to sign in. The login page then redirects straight to the identity provider, and password and passkey sign-in are refused. While discovery has not succeeded, the local login form is shown instead of a redirect that could not work.

**Signing out of the identity provider:**

By default, signing out of EmailEngine only ends the EmailEngine session - the identity provider session stays active, so the next sign-in may complete without a prompt. Set `OIDC_LOGOUT=true` to also end the identity provider session on logout (RP-initiated logout). Optionally set `OIDC_POST_LOGOUT_REDIRECT_URI` to `{serviceUrl}/admin/login?loggedout=1` to return to an EmailEngine signed-out screen afterwards; this URL must be registered as a post-logout redirect URI at the identity provider. Without it, the identity provider shows its own logged-out page.

### Okta

**Setup:**

1. Create a web application in the [Okta developer console](https://developer.okta.com/)
2. Set the sign-in redirect URI to `{serviceUrl}/admin/login/okta`
3. Configure the environment variables:

```bash
OKTA_OAUTH2_ISSUER=https://your-org.okta.com/oauth2/default
OKTA_OAUTH2_CLIENT_ID=your-client-id
OKTA_OAUTH2_CLIENT_SECRET=your-client-secret
```

4. Restart EmailEngine

All three environment variables must be set to enable Okta SSO. When enabled, a "Sign in with Okta" button appears on the admin login page.

For the variable reference, see [SSO Configuration](/docs/configuration/environment-variables#single-sign-on-sso).

## Audit Logging

EmailEngine logs all admin authentication events with structured data for security monitoring.

**Logged events:**

| Event | `msg` | Other fields |
|---|---|---|
| Successful password login | `Admin login successful` | `method: password`, `user`, `remoteAddress` |
| Failed password login | `Failed to authenticate` | `method: password`, `user`, `err`, `remoteAddress` |
| Password login refused because `OIDC_FORCED` is set | `Password login refused: OIDC_FORCED` | `remoteAddress` |
| Login attempts rate limited | `Rate limited` | `remoteAddress` |
| Successful TOTP verification | `TOTP verification successful` | `method: totp`, `user`, `remoteAddress` |
| Failed TOTP verification | `Failed to verify TOTP` | `method: totp`, `err`, `remoteAddress` |
| TOTP code replayed | `TOTP code recently used` | `user`, `remoteAddress` |
| Successful passkey login | `Passkey authentication successful` | `method: passkey`, `user`, `remoteAddress` |
| Failed passkey login | `Passkey auth failed: ...`, naming the reason (challenge expired or invalid, unknown credential, verification failed, user mismatch) | `method: passkey`, `remoteAddress` |
| Passkey registered | `Passkey registered` | `method: passkey`, `user`, `name`, `remoteAddress` |
| Passkey deleted | `Passkey deleted` | `method: passkey`, `user`, `credentialId`, `remoteAddress` |
| Passkeys cleared (password change) | `All passkeys cleared after password change` | `user`, `cleared` |
| Admin page refused by the address allowlist | `Blocked access from unlisted IP address` | `remoteAddress`, `allowedAddresses`, `req` |

These events are written to the application log (stdout) as JSON, at level `info` for successes and `warn` for refusals. Use these log entries to detect unauthorized access attempts and feed them into your SIEM or log aggregation system.

## See Also

- [Security Best Practices](/docs/deployment/security) - The address allowlist for `/admin`, API token requirement, and the rest of the hardening checklist
- [Reset Password](/docs/configuration/reset-password) - Recovering a lost password, authenticator or passkey from the host
- [Environment Variables](/docs/configuration/environment-variables#single-sign-on-sso) - The `OIDC_*` and `OKTA_OAUTH2_*` variable reference
- [Access Tokens](/docs/api-reference/access-tokens) - Authentication for the REST API rather than the admin interface
- [FIPS Mode](/docs/deployment/fips-mode) - The passkey algorithms and password hashing a FIPS host allows
