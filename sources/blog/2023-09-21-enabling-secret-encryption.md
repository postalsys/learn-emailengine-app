---
title: Enabling secrets encryption
slug: enabling-secret-encryption
date_published: 2023-09-21T10:56:00.000Z
date_updated: 2023-09-21T11:00:30.000Z
tags: EmailEngine, Compliance
excerpt: By default EmailEngine stores all data in cleartext which is fine for testing but maybe not so much for production. This is why EmailEngine offers a field level encryption option that encrypts all sensitive fields like account passwords, access and refresh tokens.
---

By default, EmailEngine stores all data in cleartext, which is fine for testing but maybe not so much for production. This is why EmailEngine offers a field-level encryption option that encrypts all sensitive fields like account passwords, access and refresh tokens, settings value for Google OAuth client secret, etc., using the *aes-256-gcm* cipher.

Encryption settings can not be changed during runtime. To start using encryption (or disabling it), you have to stop EmailEngine, perform encryption migration and then start EmailEngine with new encryption options.

### Enabling encryption on a new instance

If you do not have any email accounts set up, then this is the easiest solution. Set up an encryption secret and start EmailEngine. That's it. You can provide the encryption secret using the `EENGINE_SECRET` environment variable.

    $ export EENGINE_SECRET="secret-password"
    $ emailengine
    

> In general you probably do not want to provide environment variables by using the `export` command from cli. Instead see the best option for your deployment solution. For example when running as a SystemD service, you could add `Environment="EENGINE_SECRET=secret-password"` to the `[Service]` section in the unit file. EmailEngine is also able to pick up the dotenv (`/.env`) file from current working directory.

### Enabling encryption on an existing instance

Even though you could use the same approach as with a new instance, you probably should not. This would mean that while new email accounts would have encrypted secrets, all existing email accounts would still be in cleartext. So, the setup path requires an additional step.

1. Stop EmailEngine
2. Run the EmailEngine encryption migration tool to encrypt existing secrets
3. Start EmailEngine with encryption options

The encryption tool is actually the same command you would normally use to start EmailEngine, except it takes an additional argument `encrypt`.

    $ export EENGINE_SECRET="secret password"
    $ emailengine encrypt --any.command.line.options
    

Running `emailengine encrypt` instead of just `emailengine` encrypts all existing secrets and then exits the application.

### Changing encryption secret

If you have any reason to believe that your encryption secret has been leaked or you want to do regular secrets rollover you can use the `emailengine encrypt` command. In this case, you would also have to provide the previous secret for the command. EmailEngine would then decrypt the secret value, encrypt it with the new secret, and store it.

    $ export EENGINE_SECRET="secret password"
    $ emailengine encrypt  --decrypt="old-secret" --any.command.line.options
    

If you have messed up your installation and have accounts encrypted with different secrets, then you can provide these secrets separately.

    $ export EENGINE_SECRET="secret password"
    $ emailengine encrypt  --decrypt="old-secret-1" --decrypt="old-secret-2" ...
    

### Disabling encryption

This is similar to changing the secret, except that you'd provide the old secrets but not a new one.

    $ emailengine encrypt  --decrypt="old-secret" --any.command.line.options
    

---

In any case, once you have decided on encryption settings, you have to keep using these, otherwise, strange things will start to happen.
