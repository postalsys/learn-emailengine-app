---
title: Packaging and selling a Node.js app
slug: packaging-and-selling-a-node-js-app
date_published: 2023-03-10T19:33:00.000Z
date_updated: 2023-06-22T09:24:40.000Z
tags: EmailEngine
---

I sell a downloadable server software called [EmailEngine](https://emailengine.app/). EmailEngine, when started, runs a simple web server that serves a dashboard and an API. If you'd provide credentials of any email account to EmailEngine, it will open an IMAP session to that account and continuously index it. EmailEngine would then send you a webhook about it whenever something changes on that account. So, in general, EmailEngine works as an email client. But instead of a GUI, it has the [REST API](https://api.emailengine.app/). And instead of desktop notifications, it sends [webhooks](https://emailengine.app/webhooks). And instead of a few email accounts, it can process thousands of accounts.

Under the hood, EmailEngine is a regular Node.js application. It uses the [Hapi](https://hapi.dev/) framework for the API server, [BullMQ](https://bullmq.io/) for internal queues, [Nodemailer](https://nodemailer.com/about/) to send emails, etc. For the users, it is a single executable you can download and run on your server or a docker container you can run in your container infrastructure. Most EmailEngine users know nothing about Node.js, and I don't advertise it as a Node.js-specific software. For users, it's an app you start and then interact with over a REST API.

EmailEngine is not free. It requires a license key you get when you subscribe to a paid plan at my [company's homepage](https://postalsys.com/plans). EmailEngine subscription is available as a yearly plan, and if your subscription ends, your EmailEngine instances also stop processing email accounts. Still, EmailEngine is not completely closed, as all source code is hosted publicly in [GitHub](https://github.com/postalsys/emailengine). So anyone who wishes can audit the files to see if it is not doing anything suspicious. Though, it is not open source, but "view source," or however to call it.

### Distribution

What I hate the most are the 10+ step setup instructions that are common for server software. Each of these steps might take a lot of time and can also fail in a different way. There are a lot of assumptions about installed packages and so on. And when something fails, and you're not an expert in the specific domain (for example, you are not familiar with the specific programming language), then there's not much else to do than to google around, complain at the product forum, or move on to alternative solutions.

With EmailEngine, I wanted to provide the easiest solution possible. There's a single prerequisite, which is [Redis](https://redis.io/). You can then download EmailEngine for your operating system, whatever it is, and run it. That's it. Considering that EmailEngine is a Node.js app, this is not an easy feat.

I use [pkg](https://npmjs.com/package/pkg) from Vercel to package EmailEngine into a single binary and GitHub Actions to build and publish the Docker images.

### Database selection

EmailEngine stores different kinds of data, and for most of it, a relational database would be a perfect fit. As I wanted to keep the stack as simple as possible, I wanted to go with a single database, and this is why I use Redis to store all data. This has some obvious cons. For example, it makes listing and searching structured data (like lists of email accounts with details) quite cumbersome. Unfortunately, due to how IMAP works, Redis was the only DB server I was able to use for IMAP indexing at scale.

In brief, the IMAP protocol sends notifications to clients not by email IDs but by email sequence numbers. For example, `100 EXPUNGE` means that the 100th email in the folder was deleted. Not an issue with small numbers, `LIMIT 100,1` works just fine in every situation, but consider that a mailbox can contain hundreds of thousands of emails. As emails are ordered from oldest to newest, any operation on newer emails (like marking the newest email in the folder as read) means we would be operating at the higher end of the scale. Running a bunch of `LIMIT 200000,1` SQL queries can become very slow. With Redis, there is the Sorted Set data structure that allows manipulating entries based on the rank, which, for emails sorted by UID, is the same as the sequence number.

The main pro of Redis is also ease of use. There really is not much in getting a simple Redis server up and running. And you also do not have to be an ops wizard to back up Redis databases or set up master-replica instances. Obviously, there are challenges running Redis in prod with a lot of data. RAM is not cheap at all. And as such EmailEngine also has to set constraints, which I would rather not have. For example, when EmailEngine [analyzes an email with OpenAI](__GHOST_URL__/improved-chatgpt-integration-with-emailengine/), the resulting data is not permanently stored and is only included in the webhook payload. It would just take up too much space to store all of it.

### Release process

The release process is mostly automatic. And by automatic, I mean that I run a large bash script (sorry, I still refuse to move over to zsh). I still need to generate a draft release in GitHub manually, and later, once all assets are uploaded, mark it from the draft status as the latest.

The executables are all generated, signed, and uploaded by the release script automatically.

### File size

The size of the distributed application is around 60MB, and the installed executable is slightly larger, around 80-90MB. Yes, this is not 4MB, but it's not that high either, considering that it includes a huge sinkhole called the node_modules folder. The executable size would be far higher, but pkg allows using compression on the application files (`pkg --compress Brotli`). It takes around 10 minutes to compress everything on my M1Pro, but the decreased file size is worth it, as the executable without compression would be around 200MB.

### Distribution

All release files are uploaded to [Github Releases](https://github.com/postalsys/emailengine/releases). The download links on [EmailEngine.app](https://emailengine.app/#downloads) redirect to the specific file in the latest release. So once I mark a release as the latest, all download links start pointing to the uploaded files.

All commits and tags in Github are signed with my GPG key. And the release process also generates a file with hashes for uploaded release files. That hashes files are also signed with the same GPG key.

### Mac

For Mac, there are 2 separate builds. One for x86 and the other for ARM processors. Historically, the default Mac release has been for x86, so the Mac download button on emailengine.app also links to the x86 package. For the Apple Silicon file, you need to find the download link from the extended setup [instructions page](https://emailengine.app/set-up#2-emailengine).

Once the executable for Mac has been generated, it is signed and notarized with my developer certificate. This is all part of the release bash script that first uses `codesign` to sign the generated executable, then `pkgbuild` to generate the installer file, `notarytool` to upload the signed executable to Apple's notarization server, and finally `stapler` to add the notarization info to the executable.

The final result is an installer file you can run without getting ugly warnings. This process is also the sole reason I have the $99 Apple Developer subscription.

### Windows

I do not sign Windows executables, and as the app is a CLI app, not a windowed GUI, Windows usually does not complain about the missing certificate.

There is an additional build step for Windows, though. That is metadata override. By default, the generated Windows executable looks like a custom version of Node.js. It has the same logo and metadata, like the Copyright holder and application description, as the official Node.js executable has. This is because the generated application is exactly that – a custom version of Node.

I use the [resedit](https://www.npmjs.com/package/resedit) module to replace the logo file and override metadata fields in the executable.

### Linux

There are no additional build steps for Linux. It is published directly as whatever comes from *pkg*.

### Docker

Docker images are built with GitHub Actions and published to [Docker Hub](https://hub.docker.com/r/postalsys/emailengine/tags) and to the GitHub container registry. I previously used the autobuild option in Docker Hub directly, but it was not able to generate multi-platform images. So, to support ARM, I had to move from Docker Hub autobuild to GitHub Actions.

### Specific targets

EmailEngine has helpers for some application hosting platforms. You can find EmailEngine from [DigitalOcean's marketplace](https://marketplace.digitalocean.com/apps/emailengine). There is also native support for [Heroku](https://emailengine.app/set-up#heroku) and [Render](https://emailengine.app/set-up#render). And you can also run it as a Captain Rover app. I would like to add more platforms, but the reality is that EmailEngine is not really run that way. So adding support for some obscure platform does not guarantee any additional customers.

### Selling EmailEngine

As previously stated, EmailEngine requires a valid license key to run. You can provision such keys if you have a [paid subscription](https://postalsys.com/plans) from my company's homepage. The subscription itself is managed by Stripe. The system is kind of a mess right now as I use a mix of custom pages and Stripe's billing portal. You can enter the billing details and activate the subscription on my company's website, but add card numbers, download invoices, and cancel active subscriptions from Stripe's billing portal.

At first, I wanted to let the billing portal manage everything, but unfortunately, when I started, there was no easy way to enable taxes (I comply with the VAT terms) when using the billing portal. This is the reason for the frankenstein-ish billing setup. I'm pretty sure I've lost some customers because they couldn't figure out what was happening with the system.

---

EmailEngine is the first application I have had some commercial success with. Some people have been complaining because [all my other stuff](https://github.com/andris9) is free open source, and they would like to use EmailEngine as well for free, but running the company is now my main job and the main way I get paid, so I can't afford that.

You can also follow my journey in building and selling software from EmailEngine's [Indie Hacker page](https://www.indiehackers.com/product/emailengine).
