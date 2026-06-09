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

Use one of the conventional values: `y`, `yes`, `1`, `true`

```bash
EENGINE_FEATURE_EXAMPLE=true
EENGINE_FEATURE_EXAMPLE=1
EENGINE_FEATURE_EXAMPLE=yes
```

Note that the value check is loose - any value matching the regular expression `/^y|1|t/i` enables the flag. This means a value starting with "y", or containing "1" or "t" anywhere, counts as enabled (for example, `EENGINE_FEATURE_EXAMPLE=later` would enable the flag because it contains a "t"). Stick to the conventional values above to avoid surprises.

**Disabling a feature:**

Remove the environment variable entirely. This is the only safe way to disable a feature flag.

:::warning Do not set a "disable" value
Setting a feature flag environment variable to a non-enabling value such as `false`, `0`, or `no` prevents EmailEngine from starting in current versions - the startup code throws an error when it encounters such a value. Always unset the variable instead.
:::

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
