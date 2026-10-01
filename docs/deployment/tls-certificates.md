---
title: TLS Certificates
description: How EmailEngine picks the certificate its own listeners serve - Let's Encrypt, an uploaded certificate, environment material, or a self-signed fallback
sidebar_position: 6
---

# TLS Certificates

EmailEngine manages the certificates for the listeners it runs itself:

| Listener | Serves TLS when |
|----------|-----------------|
| [SMTP server](/docs/sending/smtp-interface) | The `smtpServerTLSEnabled` setting is on |
| [IMAP proxy](/docs/receiving/imap-proxy-server) | The `imapProxyServerTLSEnabled` setting is on |
| API and admin interface | `EENGINE_API_TLS=true` |

All three are configured on one page, **Configuration > TLS Certificates** (`/admin/config/tls`), and all three ask the same resolver which certificate to serve.

This page is about certificates EmailEngine *presents*. Whether a connection *to* a mail server is encrypted, and whether its certificate is checked, is a per-account setting covered in [IMAP and SMTP configuration](/docs/accounts/imap-smtp#ssltls-configuration).

:::info Most deployments do not need this
TLS is usually terminated at a reverse proxy, which leaves EmailEngine on plain HTTP. See [Nginx Reverse Proxy](/docs/deployment/nginx-proxy). The page below matters when EmailEngine has to present a certificate itself, which the SMTP server and the IMAP proxy always do, because a mail client connects to them directly.
:::

Since v2.80.0 certificate handling is unified across the three listeners, and the resolution order below is the one every listener follows. Earlier releases resolved certificates per listener, with the differences noted under [Behavior notes](#behavior-notes).

## Where a certificate comes from

Every certificate the instance holds is listed in the **Certificates** table of the TLS Certificates page, under an id the settings refer to it by:

| Id | Certificate | Where it lives |
|----|-------------|----------------|
| `env:api`, `env:smtp`, `env:imapProxy` | Material from that listener's environment prefix or the configuration file | `EENGINE_API_TLS_*` or `[api.tls]`, `EENGINE_SMTP_TLS_*`, `EENGINE_IMAPPROXY_TLS_*` |
| `manual` | The certificate uploaded through the admin interface | EmailEngine's Redis `tls` hash, key encrypted |
| `acme:<hostname>` | The Let's Encrypt certificate for that configured name | The certificate store EmailEngine maintains |
| `self-signed` | A self-signed certificate covering every configured name | EmailEngine's Redis `tls` hash, key encrypted |

Which one a client receives is decided in two steps.

**The default certificate** of the listener answers a client that names no host (SNI), and every name the certificate covers. Each listener has its own, chosen from the table above with the `apiTLSCertificate`, `smtpServerTLSCertificate` and `imapProxyServerTLSCertificate` settings, or on the page in the **Listeners** table. Left on `auto`, it is the listener's own environment material when that is set, otherwise the certificate for the Service URL hostname, otherwise any certificate at all, otherwise the self-signed fallback. See [Default certificate per listener](#default-certificate-per-listener).

**Every other configured name** is answered with the certificate resolved for that name, taking the first source that covers it:

| Order | Source |
|-------|--------|
| 1 | The listener's own environment material |
| 2 | The uploaded certificate |
| 3 | The Let's Encrypt certificate for that name |
| 4 | The self-signed certificate |

Sources 2 and 3 are consulted only when the [certificate source](#certificate-source) setting admits them. Source 4 is the floor: a listener with TLS switched on always has something to serve, so it always starts.

Choosing a default never takes a name's own certificate away. A default of `manual` on the SMTP server, with an upload that does not cover `smtp.example.com`, still answers a client asking for `smtp.example.com` with the certificate issued for it. A configured name that neither the default nor any admitted source covers is answered with the self-signed certificate, which covers every configured name; a name that is not configured at all is answered with the default.

## Which hostnames get a certificate

The list is the hostname of the **Service URL**, followed by anything in the `tlsHostnames` setting (**Additional hostnames** on the TLS Certificates page, one per line). Names are lower-cased and deduplicated, and the Service URL hostname is always first.

Each name gets **its own certificate**, selected per connection by SNI. That is what lets the built-in SMTP server on `smtp.example.com` hold a certificate for that name while the admin interface is on `emailengine.example.com`.

A client that sends no SNI is served the listener's [default certificate](#default-certificate-per-listener).

With no Service URL and no additional hostnames, TLS listeners serve a self-signed certificate issued to `localhost`.

### Names Let's Encrypt cannot validate

These are skipped when ordering, and served from the uploaded or self-signed source instead:

- IP addresses, v4 or v6
- Single-label names with no dot, such as `mailserver`
- Names ending in `.local`, `.lan`, `.internal`, `.home.arpa` or `.localhost`

The admin page says so on the hostname's card rather than offering a button whose only outcome is an error.

## Default certificate per listener

Each listener presents one certificate by default: to a client that names no host, and for every name that certificate covers. The setting per listener holds an id from the table under [Where a certificate comes from](#where-a-certificate-comes-from), or `auto`:

| Setting | Listener |
|---------|----------|
| `apiTLSCertificate` | The API and admin interface, when `EENGINE_API_TLS` is on |
| `smtpServerTLSCertificate` | The SMTP server |
| `imapProxyServerTLSCertificate` | The IMAP proxy |

`auto` (the default, and what an empty value means) is the listener's own environment material when it is set - an operator who set `EENGINE_SMTP_TLS_CERT` meant the SMTP server to present it - and otherwise the certificate for the Service URL hostname, then any certificate at all, then the self-signed fallback. On the page the **Automatic** entry of each dropdown says what it currently amounts to.

An explicit choice is presented whatever the [certificate source](#certificate-source) setting admits, the way environment material always was: it is an instruction. A listener may be told to present another listener's environment material (`env:api` on the SMTP server, for instance), since the environment is shared by every worker.

A chosen certificate that stops existing - the upload is removed, the hostname whose issued certificate was chosen is taken off the list, or the setting names a certificate the instance does not hold - is not an error. The setting is kept, the listener presents its automatic choice and logs a warning, and the page says so under the dropdown; saving the page as it stands writes `auto`. The same happens whichever way the certificate went away, through the admin interface or the API.

## Certificate source

The `tlsProvisioning` setting decides which *stored* sources are admitted. It is not only a switch for whether an order is placed - it decides what is served, so switching an instance to self-signed stops it serving the Let's Encrypt certificate it already holds.

| Value | Admin label | Uploaded certificate | Let's Encrypt |
|-------|-------------|----------------------|---------------|
| `acme` (default) | Automatic (Let's Encrypt) | Served | Served and ordered |
| `manual` | Uploaded certificate | Served | Not served, never ordered |
| `self-signed` | Self-signed only | Not served | Not served, never ordered |

Environment material is admitted by every value, including `self-signed`, and so is a certificate a listener was explicitly told to present.

`manual` means renewal is yours to do: an uploaded certificate is never renewed automatically, and EmailEngine contacts no certificate authority in this mode.

## Automatic certificates

With the source set to `acme`, EmailEngine orders from Let's Encrypt and answers the `http-01` challenge itself at `/.well-known/acme-challenge/`. Two things have to be true for every eligible hostname:

1. The name resolves to this machine.
2. A request to **port 80** for that name reaches EmailEngine, directly or forwarded by a reverse proxy.

Nothing else is required. There is no DNS API to configure and no separate ACME client to install.

### Check reachability

The **Check reachability** button on each hostname's card arms a short-lived token, then makes the exact request Let's Encrypt will make against the instance's own public name. It reports what actually failed - no DNS record, a port 80 answered by something else, a path that returns content from a different server - instead of leaving you with an opaque ACME error minutes later. The probe is valid for 120 seconds and the request times out after 20.

### Ordering and renewal

Nothing orders a certificate on a page render or a checkbox click. A background reconciler in the primary API worker owns every reason a certificate might be ordered, including renewal, and the **Request certificate** button asks it to run now rather than doing the work itself. Progress arrives in the admin interface over the change feed, so no request is held open for the length of an order.

The reconciler runs every 10 minutes and, per hostname:

- Orders when there is no valid certificate, retrying at most every 15 minutes after a failure.
- Skips a certificate that was checked within the last 8 hours.
- Otherwise asks Let's Encrypt through [ACME Renewal Information](https://datatracker.ietf.org/doc/draft-ietf-acme-ari/) whether the certificate should be replaced yet, falling back to a threshold scaled to the lifetime the certificate authority issued. Asking matters for the one case a fixed threshold handles badly: a mass revocation, where the CA needs certificates replaced well before their own schedule.

A renewal does **not** restart the SMTP or IMAP proxy worker. Each swaps its secure context in place, so submissions and IMAP sessions in flight are not cut for a certificate that had weeks left on it.

State for a hostname you stop serving is cleared automatically, including when the settings were changed through the API rather than the form.

### Pointing at a different certificate authority

`EENGINE_ACME_DIRECTORY_URL` names the CA directory (default `https://acme-v02.api.letsencrypt.org/directory`) and `EENGINE_ACME_ENVIRONMENT` names the stored account record (default `emailengine`).

:::warning Override both or neither
The environment names the account record and the directory names the CA that issued it. Moving one alone presents an account key the other CA has never seen, and every request is rejected.
:::

To rehearse issuance against Let's Encrypt staging, which has the same asynchronous order finalization as production and no rate limits worth worrying about:

```bash
EENGINE_ACME_DIRECTORY_URL=https://acme-staging-v02.api.letsencrypt.org/directory
EENGINE_ACME_ENVIRONMENT=emailengine-staging
```

Staging certificates are signed by a root nobody trusts, so every client refuses them. The TLS Certificates page shows a warning banner for as long as an instance is pointed at a staging directory.

## Uploading your own certificate

**Upload a certificate** on the TLS Certificates page takes a PEM certificate, an optional chain, a PEM private key, and a passphrase if the key is encrypted. The passphrase is used to read the key and is not stored.

Everything is validated before anything is written. A certificate that does not parse, a key that does not parse, or a pair that does not match is refused at upload time rather than stored and discovered at the next restart, with the listener down and the admin interface still showing the certificate as installed.

The stored private key is encrypted with the instance secret and is never shown again.

One uploaded certificate is held at a time, and it is used for every hostname it covers. It takes precedence over anything EmailEngine would obtain on its own, and it is never renewed automatically.

## The self-signed fallback

Generated on the instance the first time a TLS listener needs a certificate and nothing better is available. It covers every configured hostname at once, or `localhost` when none is configured, and it is replaced 30 days before it expires.

The key is unique to the installation and stored encrypted; no other copy of EmailEngine has it. It is generated with Node's own `crypto` module, so no OpenSSL binary is involved and the behavior is identical on every platform EmailEngine ships for.

:::warning A self-signed certificate cannot be verified
Clients have no way to establish that it is genuine. Either pin the SHA-256 fingerprint shown on the page, or configure the client to accept the certificate. Do not treat a listener on a self-signed certificate as equivalent to one on an issued certificate.
:::

**Generate a new one** on the page replaces it. Anything that pinned the old fingerprint has to be updated.

Before this fallback existed, a listener with TLS switched on and no certificate refused to start with `ETLSNOCERT` and crash-looped, while the admin interface described a self-signed certificate that was never generated.

## Supplying certificates through the environment

Each listener reads its material from its own prefix. See [Certificates for EmailEngine's Own Listeners](/docs/configuration/environment-variables#certificates-for-emailengines-own-listeners) for the full suffix table.

```bash
EENGINE_API_TLS=true
EENGINE_API_TLS_KEY_FILE=/etc/emailengine/tls/api.key
EENGINE_API_TLS_CERT_FILE=/etc/emailengine/tls/api.crt
```

The variables carry PEM content, not paths. To read a file instead, use the `_FILE` suffix as above - the convention EmailEngine applies to every environment value - or, for the API listener only, `certPath` and `keyPath` under `[api.tls]` in the configuration file.

Material supplied this way is listed in the Certificates table like any other certificate, under `env:api`, `env:smtp` or `env:imapProxy`, and is the automatic [default](#default-certificate-per-listener) of the listener whose prefix it came from. For the names it covers it outranks an uploaded certificate and a Let's Encrypt one on that listener, whatever the certificate source is set to. It is not the only possible default: a listener can be told to present any other certificate the instance holds, and another listener can be told to present it. Names it does not cover are served the certificate that covers them, or the self-signed fallback.

Leaving these unset is the normal case: an instance that already holds a certificate for its own service domain does not need a second pipeline to serve it here.

## Configuring through the API

All of these are ordinary [settings](/docs/api/post-v-1-settings) and can be set without the admin interface:

```bash
curl -X POST "https://emailengine.example.com/v1/settings" \
  -H "Authorization: Bearer $EE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tlsProvisioning": "acme",
    "tlsHostnames": ["smtp.example.com", "imap.example.com"],
    "smtpServerTLSCertificate": "acme:smtp.example.com",
    "imapProxyServerTLSCertificate": "acme:imap.example.com"
  }'
```

Certificates for names added this way are ordered by the same background reconciler, on its next pass, and the listeners reload their material as soon as the settings are written.

## Behavior notes

- **Since v2.80.1**, each listener presents a default certificate chosen with `apiTLSCertificate`, `smtpServerTLSCertificate` and `imapProxyServerTLSCertificate`, and material from the `EENGINE_*_TLS_*` variables is listed as a certificate of its own. Before that, environment material was served ahead of everything for the names it covered and could not be chosen against, a client that named no host was served the certificate for the Service URL hostname even when the listener's own environment material covered another name, and a configured name that environment material did not cover was answered with that material rather than with the self-signed certificate.
- **Since v2.80.0**, material from `EENGINE_SMTP_TLS_*` and `EENGINE_IMAPPROXY_TLS_*` takes precedence over a certificate EmailEngine manages. Before that, the SMTP server and the IMAP proxy loaded the environment certificate and then overwrote it with whatever had been provisioned for the Service URL hostname, so a pinned certificate was silently replaced.
- **Since v2.80.0**, enabling TLS on the SMTP server or the IMAP proxy is an ordinary checkbox. It previously ordered a certificate in the foreground, before the setting was saved, and unchecked itself when the order failed. The self-signed fallback is what allows the checkbox to be independent of whether a certificate has been obtained.
- **Since v2.80.0**, a listener holds one certificate per hostname and selects between them by SNI. Earlier releases served a single certificate for the Service URL hostname.
- **Since v2.80.0**, `tlsProvisioning` decides which sources are served, not only whether an order is placed.

## See Also

- [Nginx Reverse Proxy](/docs/deployment/nginx-proxy) - Terminating TLS ahead of EmailEngine instead
- [Environment variables](/docs/configuration/environment-variables#certificates-for-emailengines-own-listeners) - The full suffix table for each listener prefix
- [SMTP Interface](/docs/sending/smtp-interface) - The submission listener and its TLS setting
- [IMAP Proxy](/docs/receiving/imap-proxy-server) - The proxy listener and its TLS setting
- [Security Best Practices](/docs/deployment/security) - Firewall rules, headers, and access restrictions around the instance
