---
title: Docker
sidebar_position: 2
---

**Pull EmailEngine from Docker Hub**
To get started, pull the EmailEngine image from [Docker Hub](https://hub.docker.com/r/postalsys/emailengine):
```
$ docker pull postalsys/emailengine:v2
```
> EmailEngine is also available from the [GitHub Container Registry](https://github.com/postalsys/emailengine/pkgs/container/emailengine).
**Configure EmailEngine**
You can configure EmailEngine by setting environment variables. In the example below, we set up the Redis connection URL and bind port 3000:
```
$ docker run -p 3000:3000 --env EENGINE_REDIS="redis://host.docker.internal:6379/7" postalsys/emailengine:v2
```
For more configuration options, visit the [configuration documentation](/configuration).
**Access EmailEngine in Your Browser**
After running the command above, open the following URL in your browser: [http://127.0.0.1:3000](http://127.0.0.1:3000).
> The EmailEngine Docker images support multiple architectures, so you can easily run them on Apple processors as well.
### EmailEngine Tag Types
EmailEngine offers various tag types for its Docker images:
1.  `latest`: Corresponds to the most recent commit in the master branch. While it includes the latest features, it might be unstable.
2.  `v2`: Represents the latest tagged release for the v2 branch.
3.  `v2.x.x`: Refers to a specific tagged release.