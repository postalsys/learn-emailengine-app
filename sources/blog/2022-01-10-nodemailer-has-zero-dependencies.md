---
title: Nodemailer has zero dependencies
slug: nodemailer-has-zero-dependencies
date_published: 2022-01-10T17:05:10.000Z
date_updated: 2022-05-27T20:10:33.000Z
tags: Nodemailer, SMTP
---

This post is not about [EmailEngine](https://emailengine.app/) but another software project I maintain – [Nodemailer](https://nodemailer.com/). It's a nifty module for Node.js (as you might assume from the name) that allows to send out emails. And in this post, I'll explain how and why I ended up having zero dependencies for Nodemailer even though it's a relatively large project.

Nodemailer is a long-term project of mine, I started it already 11 years ago and it shows – it is downloaded more than 1.5 million times a week, used in a huge number of different projects, and by a lot of companies, both large and small. Any time anyone moves that card on a Trello board and you get an email notification about it? Yup, that's Nodemailer in action.
![](__GHOST_URL__/content/images/2022/01/Screenshot-2022-01-10-at-15.13.30.png)*_NmP* is the Nodemailer's signature. It stands for **N**ode**m**ailer**P**ro, a reference back to the day I wanted to release a paid pro version. In the end, I merged the "pro" code back to the regular Nodemailer, so there is no paid Nodemailer, it's all MIT.
> I have no relations to Trello, it's just an example I found from my mailbox

I assume that everyone has seen the following meme image about the size of the *node_modules* folder:
[![](__GHOST_URL__/content/images/2022/01/tfugj4n3l6ez.webp)](https://www.reddit.com/r/ProgrammerHumor/comments/6s0wov/heaviest_objects_in_the_universe/)[Heaviest Objects In The Universe](https://www.reddit.com/r/ProgrammerHumor/comments/6s0wov/heaviest_objects_in_the_universe/)
And it's not far from the truth. *node_modules* can get frighteningly large. 

Here's the dependency tree of Nodemailer v2.7.2, released 5 years ago, and the last version that contained dependencies:

    └─┬ nodemailer@2.7.2
      ├─┬ libmime@3.0.0
      │ ├── iconv-lite@0.4.15
      │ ├── libbase64@0.1.0
      │ └── libqp@1.1.0
      ├─┬ mailcomposer@4.0.1
      │ ├─┬ buildmail@4.0.1
      │ │ ├── addressparser@1.0.1
      │ │ ├── libbase64@0.1.0 deduped
      │ │ ├── libmime@3.0.0 deduped
      │ │ ├── libqp@1.1.0 deduped
      │ │ ├── nodemailer-fetch@1.6.0 deduped
      │ │ ├── nodemailer-shared@1.1.0 deduped
      │ │ └── punycode@1.4.1
      │ └── libmime@3.0.0 deduped
      ├─┬ nodemailer-direct-transport@3.3.2
      │ ├── nodemailer-shared@1.1.0 deduped
      │ └─┬ smtp-connection@2.12.0
      │   ├─┬ httpntlm@1.6.1
      │   │ ├── httpreq@0.5.2
      │   │ └── underscore@1.7.0
      │   └── nodemailer-shared@1.1.0 deduped
      ├─┬ nodemailer-shared@1.1.0
      │ └── nodemailer-fetch@1.6.0
      ├─┬ nodemailer-smtp-pool@2.8.2
      │ ├── nodemailer-shared@1.1.0 deduped
      │ ├── nodemailer-wellknown@0.1.10
      │ └── smtp-connection@2.12.0 deduped
      ├─┬ nodemailer-smtp-transport@2.7.2
      │ ├── nodemailer-shared@1.1.0 deduped
      │ ├── nodemailer-wellknown@0.1.10 deduped
      │ └── smtp-connection@2.12.0 deduped
      └─┬ socks@1.1.9
        ├── ip@1.1.5
        └── smart-buffer@1.1.15
    

By today's standards, this is not even a long list, it's actually tiny, the dependency tree for a regular-sized project can easily reach thousands of lines.
And compare it against the dependency tree of the latest Nodemailer

    └── nodemailer@6.7.2
    

In fact, if you look at the [package.json](https://github.com/nodemailer/nodemailer/blob/master/package.json) of Nodemailer, the "dependency" section is not just empty, it is completely missing.

So what made me go from that tree-like structure to a single line entry?

The main reason, install speed.

Back in 2017 `npm install` was ridiculously slow. It took forever to properly resolve and download the entire dependency tree. With those v2.7.2 dependencies, it took at least 15 seconds to install Nodemailer, and remember – Nodemailer is not a project of its own, it's a library used by other projects that have many other dependencies. Removing all the dependencies in Nodemailer made that process much faster, install time was reduced to around a single second.

The other reason was also speed-related but as in development speed. Specifically, release speed. Most of the listed dependencies were managed by myself, these were built for Nodemailer. So for example, if I needed an update in SMTP handling for Nodemailer I changed it in the SMTP handling code by updating `smtp-connection` module and making a release for it. Then due to fixed dependency numbers in package.json files in other modules, I also had to bump that version number and release newer versions of `nodemailer-smtp-pool`, `nodemailer-smtp-transport`, `nodemailer-direct-transport` and after that, I had to release a new version of Nodemailer itself. Thats' five CHANGELOGs to update and five new versions to publish to *npm*. Only then this SMTP change came available for the users. Aggregating all modules into a single entity made this pain go away.

The unexpected upside turned out to be maintainability. This was not a reason to remove dependencies but a result of it. In fact, I wasn't even able to predict it. After many years Nodemailer today still supports older Node.js versions like v6. I have intentionally not used any newer ES features. This means I use callbacks and not `async...await` calls. To be honest, Node.js v6 was not so bad at all. It already has the spread operator. Also promises, at least most of the spec. And the arrow function, so need to call the `bind(ctx)` method. It's just not modern, and that's the problem. Most modules nowadays use at least something more modernish and this means these modules do not work with Node v6 as they would trigger `SyntaxErrors`.

Supporting older Node.js versions obviously isn't the only upside regarding maintainability. There are also issues where a dependency update silently breaks something. Known examples are [left_pad](https://qz.com/646467/how-one-programmer-broke-the-internet-by-deleting-a-tiny-piece-of-code/) and [colors](https://snyk.io/blog/open-source-npm-packages-colors-faker/), but more common issues are smaller and intentional changes, like dropping `new` by turning a constructor into a regular function or mixing in some newer ES syntax, or moving from CommonJS module system to ESM (looking at you, [node-fetch](https://www.npmjs.com/package/node-fetch#user-content-commonjs)), etc. In any case, once you have bumped that version number in the dependency list, you have to figure out what changed and update your code accordingly.  When maintaining Nodemailer I never have to deal with these kinds of things. Because there are no dependencies.

This did not come without problems.

While most of the dependencies were actually internal, some were not. I was able to reimplement some things but too large ones I had to drop and figure out alternatives. For example, to use SOCKS proxies that previously were built-in, the current Nodemailer expects you to provide the socks function as part of configuration options. Some features were removed completely and I don't really miss these.

The other issue was that these submodules were actually actively used by other people as well, so I couldn't completely remove these. The main solution was to install Nodemailer as a dependency and then require the needed submodule using a file path.

For example, previously `addressparser` could be loaded from a dedicated module:

    const addressparser = require('addressparser');
    

Now it is part of Nodemailer and can be loaded from a path even if Nodemailer does not directly expose it:

    const addressparser = require('nodemailer/lib/addressparser');
    

In the end, I'm pretty happy with that setup. Nodemailer is pretty much in a frozen state, so I try to not add any new features. From time to time there is some things to fix or some things to change in order to keep compatibility with newer Node.js versions (like switching from `new Buffer` to `Buffer from` a few years ago). Having no external parties to depend on, makes that process way easier.
