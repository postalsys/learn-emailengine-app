---
title: Reset Password
description: Reset the EmailEngine admin password from the command line, including recovery when 2FA or a passkey is lost
sidebar_position: 11
---

# Reset the Admin Password

If the admin password has been lost, or you are setting one during an automated deployment, set it with the `password` command. It writes directly to Redis, so EmailEngine does not need to be running.

```bash
emailengine password -p secretvalue --dbs.redis="redis://127.0.0.1:6379/8"
```

The command prints the password it stored:

```
secretvalue
```

## Options

| Option | Effect |
|--------|--------|
| `-p`, `--password` | The password to set. Must be at least 8 characters, otherwise the command exits with `Password must be at least 8 characters` |
| `--hash`, `-r` | Print the PBKDF2 hash instead of the plaintext password. This is the value [`EENGINE_PREPARED_PASSWORD`](/docs/configuration/environment-variables#prepared-configuration) expects |
| `--dbs.redis` | The Redis URL of the instance to update. Required unless the environment already provides it |

Omit `-p` and a random password is generated and printed. That is the usual choice when you only need to regain access and will change the password again from the interface.

:::info Run it from anywhere with Redis access
The `emailengine` binary only needs to reach the Redis server, so you can run this from the EmailEngine host or from your own machine. Point `--dbs.redis` at the Redis database that instance uses.
:::

## Recovering From a Lost Second Factor

Resetting the password is also the way back in when the second factor is gone, because the reset clears it:

- Two-factor authentication is turned off
- Every registered passkey for the account is deleted

Both happen unconditionally, even when you already know the password. If you only want to rotate the password and keep 2FA, change it from the admin interface instead.

The account name is left as it was, defaulting to `admin` if none was set.

## See Also

- [CLI Reference](/docs/configuration/cli) - Every command-line option, including `password`
- [Prepared Settings](/docs/configuration/prepared-settings) - Provisioning an instance with a password already set
- [Security Hardening](/docs/deployment/security) - Admin access controls and authentication options
