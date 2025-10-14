---
title: Configuration
sidebar_position: 1
---

EmailEngine uses two types of configurations:
1.  **Application Configuration**: This is loaded when the application starts and includes settings such as the HTTP port number.
2.  **Runtime Configuration**: This can be updated at any time via the [Settings API endpoint](https://api.emailengine.app/#operation/postV1Settings) or through the built-in web interface. Examples include the webhook destination URL.
You can configure the application using either command-line arguments or environment variables. If both are provided for the same setting, the environment variable will take precedence over the command-line argument.