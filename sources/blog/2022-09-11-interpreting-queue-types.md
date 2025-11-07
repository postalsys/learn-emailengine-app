---
title: Interpreting job queue types
slug: interpreting-queue-types
date_published: 2022-09-11T20:09:31.000Z
date_updated: 2022-11-18T15:21:18.000Z
tags: EmailEngine
---

[EmailEngine](https://emailengine.app/) uses queues to process background tasks, and there is a lot of these. The exact queue library used is [BullMQ](https://docs.bullmq.io/). EmailEngine includes a UI for BullMQ called [Arena](https://github.com/bee-queue/arena) to give a better overview and allow managing these queues. You can access the tool from the *Tools*->*Arena* menu.

### Queues

From Arena, you can see three queue types:

1. **submit**. This queue includes all email sending jobs.
2. **notify**. This queue includes all webhook sending jobs.
3. **documents**. This queue includes indexing information for ElasticSearch.

### Job types

Each queue is split into different job types that define the lifecycle of a job. The following applies to the *submit* queue, but it is mostly the same for other queues as well.

1. **Waiting**. This section includes all jobs that need to be processed right away. These are jobs that were inserted into the queue without the `sendAt` property, or the `sendAt` time has been reached, and thus, the job was moved here from the *Delayed* section.
2. **Active**. These are jobs that are the ones currently being processed. Jobs from *Waiting* move here one by one. If one job gets processed, another one gets moved here from *Waiting*. Depending on the result, processed jobs move to *Completed* (successful deliveries), *Failed* (too many retries reached), or *Delayed* (job failed, but `deliveryAttempts` has not been reached yet).
3. **Completed**. This includes jobs that were successfully completed. All successful deliveries end up here. It is informational only as these jobs are not used anymore for anything. When a sending job is moved here, a `messageSent` webhook is emitted.
4. **Failed**. These are jobs that failed too many times. EmailEngine tried to process these `deliveryAttempts` times in the *Active* section and always failed. Failure, in this case, means that the SMTP server did not accept the email for delivery. It does not matter what the exact reason was (network error, wrong password, spam filter triggering, etc.). Once a job ends up here, it is not retried anymore. So it is primarily informational only. You can check the error messages and so on for debugging, but these jobs are not used anymore. When a sending job is moved here, a `messageFailed` webhook is emitted.
5. **Delayed**. This type includes jobs that will be processed in the future. This means two types of jobs – these jobs with the `sendAt` value set to a future date and jobs that failed in the *Active* queue, but the `deliveryAttempts` counter has not been reached yet, so a new attempt time was calculated, and the job was moved here. Once the delay time has been reached, these jobs are moved to *Waiting*. If a job fails in *Active* section and is moved here, a `messageDeliveryError` webhook is emitted.
6. **Paused**. You can pause a queue from the Arena UI. If a queue is paused, all jobs that should go to *Waiting* end up in the *Paused* section. Once you hit the "unpause" button, these jobs are moved to *Waiting*.
7. **Waiting-Children**. This type applies to ElasticSearch indexing. It is not used for sending.

> **NB!** By default, *Completed* and *Failed* sections are always empty. To enable these sections, you need to navigate to Configuration -> Service, and set a number for the *"How many completed/failed queue entries to keep"* input field. Changing this value does not apply to existing jobs, only to new ones.
