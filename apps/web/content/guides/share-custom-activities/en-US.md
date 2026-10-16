---
title: Share, import and back up your custom activities
description: Export a Nowly activity as JSON with its images, import one or multiple files and handle errors without accidentally publishing an activity.
category: discord
order: 3
updated: 2026-10-16
related: create-custom-discord-activity, custom-activity-images, control-what-discord-shows
---

Custom activities are not synchronized with your Nowly account. To send a template to a friend, move it to another browser or keep a backup, use a **JSON** file in Nowly **2.4.0 or later**. You can import an activity without publishing it on Discord.

> Screenshots show Nowly's development preview in English with simulated data. They illustrate the extension interface, not a live Discord connection or profile.

## Export a saved activity

1. Open the activity you want to share in **Custom**.
2. If you have edited it, choose **Save**, then open it again.
3. Scroll below **Buttons** and choose **Export**.
4. Your browser downloads a file named after the activity, such as `Physics revision.json`. Characters forbidden in filenames are replaced.

**Export** is available only for an already saved activity. It exports the last saved version, not unsaved edits still open in the editor. Send the file using a service of your choice; Nowly does not automatically send it to anyone.

![Bottom of a saved activity editor with Save, Export and Delete activity actions](https://images.nowly.me/guides-screenshots/custom-activities/06-export-button.png "Export downloads the saved activity as a JSON file.")

## What the file contains

- The name, type, two text lines, hover text, timer and buttons.
- Icons and their colours, and any HTTPS links configured for images.
- Uploaded image files, embedded from local copies. If a local copy is missing on your device, that image is exported as absent.
- A Nowly format marker, format version and export date.

The file **does not include** the activity's local ID, creation/update dates, activation state, your device token or the hosting URLs of uploaded images.

> Text, embedded images and links you entered remain in the file. Remove private information before sharing. A backup containing images may be larger than a simple settings file.

## Import one or multiple files

1. Open **Custom**.
2. Use the icon-only **Import** button at the top of the list. Its tooltip identifies it.
3. Select one or multiple `.json` files exported by Nowly.
4. Wait for import to finish. If exactly one file succeeds, its editor opens for review. If several succeed, a message reports how many.
5. Review the name, text, images and button destinations before enabling **Show on Discord**.

![Imported activity open in the editor with Show on Discord switched off](https://images.nowly.me/guides-screenshots/custom-activities/08-imported-activity.png "Review an imported activity before switching it on.")

You can also drag files from your file manager onto the **Custom** tab: **Drop to import** appears. Release them over the panel. The drop zone is active only while Custom is visible, with no editor or template sheet open.

![Drop to import overlay asking for a Nowly activity JSON file](https://images.nowly.me/guides-screenshots/custom-activities/07-drop-to-import.png "Drop an exported JSON file onto the Custom tab.")

**Each import creates a new, inactive activity.** It does not replace an existing activity, even with the same name, or stop the one already running. Importing the same file twice therefore creates two copies. The **50-activity limit per device** still applies.

## Images during import

Embedded images are validated and uploaded to Nowly again to obtain URLs Discord can use for your device. This step requires a network connection and an available image service; normal upload limits apply.

If an image cannot be imported, the activity is still created without that image, with the message **An image could not be imported, it was left empty.** Open the editor to replace it. Coloured icons do not require importing an image file; HTTPS image links remain links.

## Understand import errors

| Message | What to do |
| --- | --- |
| This file is not a Nowly activity. | Use a Nowly activity export, not the general data export, a presence ZIP or an unrelated JSON file. |
| This file comes from a newer version of Nowly. Update the extension. | Update Nowly and ask the sender to check their version. Do not change the file's version number to force an import. |
| This file is too large. | The limit is 4 MiB per file. Reduce images in the original activity and export it again. |
| This activity file is invalid or incomplete. | A name, field, link or image failed validation. Ask for a new export rather than changing JSON at random. |
| You've reached the limit of custom activities. | Export anything you want to keep, then delete unused activities before trying again. |

A failed file does not prevent later files from being processed. Concurrent imports are blocked during processing; wait for completion before trying again.

![Custom tab showing the error This file is not a Nowly activity after an invalid import](https://images.nowly.me/guides-screenshots/custom-activities/09-invalid-file.png "An unrelated JSON file is rejected without creating an activity.")

## Back up activities or change browsers

Export each activity you want to keep, save the files somewhere you trust, then import them in the other Nowly installation. Export works **one activity at a time**, not as an archive of your entire collection. Check the images after transferring and manually enable the activity you want to use.

This sharing format is separate from the personal data export in Settings. It is intended for reusable activities. To make an activity before sharing it, read [Create your own Discord activity](/guides/create-custom-discord-activity).
