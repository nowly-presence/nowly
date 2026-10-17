---
title: Create your own Discord activity with Nowly
description: Create a custom activity in Nowly 2.4.0, start from a template, add text, images, a timer and buttons, then show it on Discord.
category: start
order: 5
updated: 2026-10-16
related: share-custom-activities, custom-activity-images, set-up-nowly, rich-presence-not-showing
---

A study session, coding project or game night does not always belong to a website. Since Nowly 2.4.0, the **Custom** tab lets you write your own Discord activity without installing a website presence. It does not automatically track what you do: you choose its contents and when to switch it on.

> Screenshots show Nowly's development preview in English with simulated data. They illustrate the extension interface, not a live Discord connection or profile.

## Before you start

- Update the extension to **2.4.0 or later**.
- To publish on Discord, open **Nowly Desktop** and the **Discord desktop app**. Check the connection in the extension panel.
- New to Nowly? Follow [Set up Nowly](/guides/set-up-nowly) first. You do not need a Nowly account to create an activity.

The editor preview is not proof that your activity is published: Discord must be connected and allow activity sharing.

## Pick a template or start from scratch

![Nowly Custom tab with the activity list, Import icon and Create button](https://images.nowly.me/guides-screenshots/custom-activities/01-activity-list.png "Open Custom to create or import an activity.")

1. Open Nowly's side panel, then **Custom**.
2. If the list is empty, choose **Create an activity** to start from scratch or **Use a template**.
3. If you already have activities, choose **Create** to open **Templates**. Pick **Blank** to start from scratch.
4. Choose a template, such as Studying, Coding or Coffee break, then make it your own in the editor.

The nine templates are starting points: nothing is created until you save. With **Blank**, the picker offers ten choices in five rows. You can keep up to **50 activities per device**.

![Template picker showing Blank, Studying, Coding and other activity templates](https://images.nowly.me/guides-screenshots/custom-activities/02-templates.png "Choose Blank or adapt a ready-made template.")

## Fill in the text

Use **Text** and check the **Preview** as you edit:

| Field | Example | Purpose |
| --- | --- | --- |
| Name | Physics revision | The activity name shown on Discord |
| Type | Playing | Discord layout: Playing, Listening, Watching or Competing |
| First line | Chapter 3: Thermodynamics | Main detail about your activity |
| Second line | Focus session | Optional extra information |

Names must contain **2 to 128 characters**. Both text lines are optional; if filled in, each must also contain 2 to 128 characters. Fix any highlighted errors before saving.

Discord places the name differently by type: **Playing** uses its own line; **Listening**, **Watching** and **Competing** place it in the header. Choosing a type does not start music, a video or a game.

![Activity editor with Physics revision in the preview and the Name, Type, First line and Second line fields](https://images.nowly.me/guides-screenshots/custom-activities/03-editor-preview.png "Review your text in the preview before switching the activity on.")

## Add images, a timer and buttons

Under **Images**, set a **Large image** and optionally a **Small image**. Each can use a file, an HTTPS link or a coloured icon. **Text on hover** is optional. Read [Choose images for a custom activity](/guides/custom-activity-images) for formats, limits and privacy details.

Under **Time**, choose **Time elapsed** or **Countdown**. Countdowns range from **5 minutes to 24 hours**. Time starts when you activate the activity, not when you create it. Switching it off and on again restarts the timer. There is no option to hide time completely.

Under **Buttons**, add up to **two buttons**, each with a label and an **HTTPS** link. Use addresses you are comfortable sharing with people who can see your profile. You can leave buttons unconfigured.

![Time settings with a 25-minute countdown and the Add a button action](https://images.nowly.me/guides-screenshots/custom-activities/05-timer-and-buttons.png "Choose a timer and optionally add HTTPS buttons.")

## Save, then show it on Discord

1. Choose **Save** at the top of the editor, or **Create activity** at the bottom for a new activity.
2. Switch the activity on in the list. You can also open a saved activity and enable **Show on Discord**.
3. Check the **On Discord** card in **Custom**, then your Discord profile.

**Only one custom activity can be active at a time.** Switching on another replaces the previous one. While a custom activity is active, it takes priority over tab activities; your website presences are not uninstalled.

![Custom tab with the On Discord card, Stop action and an activity switch enabled](https://images.nowly.me/guides-screenshots/custom-activities/10-active-activity.png "The active state and Stop action, illustrated in the development preview.")

> Nowly's global pause also hides custom activities. However, in 2.4.0, website presence schedules do not control a custom activity: switch it off or use the global pause to stop sharing it.

To return to tab activities, switch the activity off or choose **Stop** on its live card. A website activity can resume if an eligible tab provides one and the usual sharing conditions are met.

## Edit, delete and keep your activities

- Click an activity to edit it, then **Save**. Leaving the editor without saving discards your edits.
- **Delete activity** asks for confirmation. Deletion is permanent for this copy; export it first if you want to keep it.
- Activities stay on this device and **are not synchronized with your Nowly account**. Use [JSON export and import](/guides/share-custom-activities) to share, back up or transfer them.

## If nothing appears on Discord

First check that the activity is saved and switched on, Nowly is not paused, and Nowly Desktop and Discord are connected. Check Discord's activity privacy settings too. The [Rich Presence troubleshooting guide](/guides/rich-presence-not-showing) walks through these checks.
