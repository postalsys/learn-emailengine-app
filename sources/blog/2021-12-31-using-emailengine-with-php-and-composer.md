---
title: Using EmailEngine with PHP and Composer
slug: using-emailengine-with-php-and-composer
date_published: 2021-12-31T12:06:36.000Z
date_updated: 2021-12-31T12:14:20.000Z
tags: EmailEngine, PHP
---

[EmailEngine](https://emailengine.app/) is an application that allows access to any email account to send and receive emails. It has a small helper library for Composer that you can find [here](https://packagist.org/packages/postalsys/emailengine-php). So, in this post, I'll show how to register an email account and send out emails from that account using EmailEngine.

First, we need to add the emailengine-php library as a dependency.

    $ composer require postalsys/emailengine-php
    

Next, we can import EmailEngine class into our application.

    use EmailEnginePhp\EmailEngine;
    

And also set it up with minimal setup. We set the access token required to make API requests (generate the token on the Access Tokens page in EmailEngine's web interface) and the base URL for our EmailEngine installation.

    $ee = new EmailEngine(array(
        "access_token" => "3eb50ef80efb67885af...",
        "ee_base_url" => "http://127.0.0.1:3000/",
    ));
    

At this point, we are ready to make some API calls.

### Register an account

We can use the request helper method to perform API requests against our EmailEngine installation. We will be POSTing against the [/v1/account](https://api.emailengine.app/#operation/postV1Account) endpoint to register a new account with the ID of "example":

    $account_response = $ee->request('post', '/v1/account', array(
        'account' => 'example',
        'name' => 'Andris Reinman',
        'email' => 'andris@ekiri.ee',
        'imap' => array(
            'auth' => array(
                'user' => 'andris',
                'pass' => 'secretvalue',
            ),
            'host' => 'turvaline.ekiri.ee',
            'port' => 993,
            'secure' => true,
        ),
        'smtp' => array(
            'auth' => array(
                'user' => 'andris',
                'pass' => 'secretvalue',
            ),
            'host' => 'turvaline.ekiri.ee',
            'port' => 465,
            'secure' => true,
        ),
    ));
    

If everything succeeds, then the account gets registered with EmailEngine. We can't do much as EmailEngine starts indexing the account, and until it has not been completed, we can not run any API requests against that account.

Here's a simple helper code that waits until the account becomes active by polling [/v1/account/{account}](https://api.emailengine.app/#operation/getV1AccountAccount) and checking account state:

    $account_connected = false;
    while (!$account_connected) {
        sleep(1);
        $account_info = $ee->request('get', "/v1/account/example");
        if ($account_info["state"] == "connected") {
            $account_connected = true;
            echo "Account is connected\n";
        } else {
            echo "Account status is: ${account_info['state']}...\n";
        }
    }
    

Be aware that you might end up in an infinite loop if the account is not able to connect.
At this point, everything is ready to call the [message submission endpoint](https://api.emailengine.app/#operation/postV1AccountAccountSubmit).

    $submit_response = $ee->request('post', "/v1/account/example/submit", array(
        "from" => array(
            "name" => "Andris Reinman",
            "address" => "andris@ekiri.ee",
        ),
        "to" => array(
            array(
                "name" => "Ethereal",
                "address" => "andris@ethereal.email",
            ))
        ,
        "subject" => "Test message",
        "text" => "Hello from myself!",
        "html" => "<p>Hello from myself!</p>",
    ));
    

That's it. The message should be on its way!
