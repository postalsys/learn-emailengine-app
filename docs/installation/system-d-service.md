---
title: SystemD Service
description: Configure EmailEngine as a SystemD service for automatic startup
sidebar_position: 4
---

In most cases, you probably do not want to run EmailEngine as a regular application but as a background service. Under Linux, the easiest way to create such services would be with SystemD. EmailEngine does not fork itself and sends all its logs to standard output, so it's not a good match with the SysV Init kind of system, but it runs well with SystemD.