---
title: Log management
sidebar_position: 4
---

EmailEngine logs all its messages to standard output in [Pino](https://github.com/pinojs/pino) format. Pino uses JSON structures with some predefined keys, so it is kind of human-readable but not really. Luckily, there are many tools that we can use to transform EmailEngine logs into a more suitable format. The working principle for all these log renderers is the same – you should pipe the standard output from EmailEngine to the log rendering process.