---
title: Reset Password
description: Reset admin password using command-line tools or environment variables
sidebar_position: 11
---

If you've forgotten your admin password or need to set it during an automated setup process, you can do so using the command-line interface.
```
$ emailengine password -p secretvalue --dbs.redis="redis://127.0.0.1:6379/8"
secretvalue
```
Where
-   `secretvalue` is the password to use. If a password is not provided, then a random password is generated.
> You can execute the `emailengine` [command](/#downloads) on any computer, such as the actual EmailEngine server or your own development machine. Just make sure to use the appropriate Redis URL, which should point to the Redis server associated with your EmailEngine instance. Keep in mind that you must have access to the Redis server from the machine where you're running the `emailengine` command.
The command returns the updated admin password. This is primarily useful if you did not set the password yourself and skipped the `-p` or `--password` argument.
* * *
If you need to reset your password from the command line, be aware that doing so will also disable any two-factor authentication (2FA) setup you may have in place. If you've lost access to your authenticator app and are unable to log in to your EmailEngine instance, resetting the password through the command line will be necessary to regain access.