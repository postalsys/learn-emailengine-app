---
title: Feature Flags
sidebar_position: 7
description: Enable or disable experimental features in EmailEngine using environment variables
keywords:
  - feature flags
  - experimental features
  - environment variables
---

# Feature Flags

EmailEngine supports feature flags that allow you to enable or disable specific features at startup. Feature flags are controlled via environment variables and are primarily used for experimental or optional functionality.

## How Feature Flags Work

Feature flags are set using environment variables with the prefix `EENGINE_FEATURE_`:

```bash
EENGINE_FEATURE_<NAME>=true
```

**Enabling a feature:**

Set the value to any of these (case-insensitive): `y`, `yes`, `1`, `t`, `true`

```bash
EENGINE_FEATURE_EXAMPLE=true
EENGINE_FEATURE_EXAMPLE=1
EENGINE_FEATURE_EXAMPLE=yes
```

**Disabling a feature:**

Set the value to any other value, or remove the environment variable entirely:

```bash
EENGINE_FEATURE_EXAMPLE=false
EENGINE_FEATURE_EXAMPLE=0
EENGINE_FEATURE_EXAMPLE=no
```

### Name Formatting

Feature names are normalized internally -- hyphens, underscores, and spaces are treated as underscores:

```bash
# These all refer to the same feature:
EENGINE_FEATURE_MY_FEATURE=true
EENGINE_FEATURE_MY-FEATURE=true
```

### Startup Logging

When feature flags are enabled, EmailEngine logs them at startup:

```
{"msg":"Enabled feature flags","featureFlags":["my_feature"]}
```

## Configuration Examples

**.env file:**

```bash
EENGINE_FEATURE_NEW_UI=true
```

**Docker Compose:**

```yaml
environment:
  - EENGINE_FEATURE_NEW_UI=true
```

**Command line:**

```bash
EENGINE_FEATURE_NEW_UI=true emailengine
```

## Usage Notes

Feature flags are used internally to gate experimental functionality. The available flags may change between EmailEngine versions. When a feature flag is not recognized by the current version, it is silently ignored.

Feature flags require an application restart to take effect -- they cannot be changed at runtime.

## See Also

- [Environment Variables](/docs/configuration/environment-variables) -- All configuration options
- [Configuration Overview](/docs/configuration) -- Configuration methods
