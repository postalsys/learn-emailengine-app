---
title: Tailing webhooks
slug: tailing-webhooks
date_published: 2022-06-22T06:25:51.000Z
date_updated: 2022-06-22T06:25:51.000Z
tags: EmailEngine, PHP
---

If you run an application that produces a lot of webhooks like [EmailEngine](https://emailengine.app/), you might want to observe what kind of data is even sent before you try to start consuming it. This post shows an easy way to do this with PHP.

The concept is simple. Your webhooks producer posts all webhooks to a PHP script. That script then appends all incoming JSON requests with some metadata to a log file. You would tail that log file and pipe it to the *jq* command, resulting in a real-time pretty printed log output. As the content is stored in a log file, you can stop tailing any time you want and return to it later.

First, if you do not have *jq* yet installed, you can add it using your package manager. For example, in Ubuntu, you can run the following:

    $ sudo apt update
    $ sudo apt install -y jq
    

Next, create a log file. I'll be running PHP scripts under the `www-data` user, so I need to make sure PHP can write to that file.

    $ sudo touch /var/log/whlog
    $ sudo chown www-data /var/log/whlog

> Make sure that this file is empty. Otherwise, jq will fail to process it if it contains non-JSON data.

Next, get the example PHP script from [here](https://gist.github.com/andris9/e1ad312ef25c46dd9397d2726995581a) and, if needed, change the log file path at the beginning of the script. Store this script somewhere in your web server so that you would be able to run requests against it.

Now, add the PHP script as the webhook destination in your app, in this case, for EmailEngine.
![](__GHOST_URL__/content/images/2022/06/Screenshot-2022-06-22-at-09.14.05.png)
In the server where the log file resides, run the following command to tail the log output.

    $ tail -f /var/log/whlog | jq
    

And finally, to test if everything works, send a test webhook payload from EmailEngine.
![](__GHOST_URL__/content/images/2022/06/Screenshot-2022-06-22-at-09.13.39.png)
If you get a "Test payload sent" response, then EmailEngine managed to send out the webhook.
![](__GHOST_URL__/content/images/2022/06/Screenshot-2022-06-22-at-09.14.23.png)
Check the terminal window where you are tailing the log file. You should see the example webhook payload. Anything the server sent is inside the "request" property.
![](__GHOST_URL__/content/images/2022/06/Screenshot-2022-06-22-at-09.16.26.png)
That's it! You can now tail any kind of webhooks in real-time, as long as these are JSON formatted.
