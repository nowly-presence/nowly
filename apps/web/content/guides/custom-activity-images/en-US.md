---
title: Choose images for a custom activity
description: Upload an image, use an HTTPS link or an icon, and understand local copies, expiry and image errors in Nowly 2.4.0.
category: troubleshooting
order: 5
updated: 2026-10-16
related: create-custom-discord-activity, share-custom-activities, rich-presence-not-showing
---

Each custom activity has a **Large image** and a **Small image**, shown as a badge over the first. Open the activity in **Custom**, then **Images**. For the rest of the editor, see [Create your own Discord activity](/guides/create-custom-discord-activity).

> The screenshot shows Nowly's development preview in English with simulated data. It illustrates image controls, not a real upload or live Discord connection.

## Pick the right source

| Option | When to use it | What to know |
| --- | --- | --- |
| Icon | A simple image without preparing a file | 24 icons and 10 colours, generated for Discord by Nowly. |
| Upload | Your own illustration | A copy stays on your device and a version is sent to Nowly's image service. |
| Link | An image already available online | Use a direct HTTPS image URL, not a sharing page or private file. |
| None | No chosen image | For the large image, Discord uses the Nowly logo; for the small image, no badge is shown. |

A new activity may already offer a coloured icon. Explicitly choose **None** if you prefer the behaviour without a custom image.

![Image settings with Upload, Link, Icon and None options, a colour palette and 24 icons](https://images.nowly.me/guides-screenshots/custom-activities/04-image-options.png "Choose an image source for the large image and the optional small badge.")

## Upload your own file

1. Under **Large image** or **Small image**, choose **Upload**.
2. Use **Choose an image** and select a PNG, JPEG, WebP or GIF file.
3. Wait for the upload to finish before saving the activity.
4. Optionally add **Text on hover**, then choose **Save**.

Non-GIF images are automatically resized, targeting **1024 pixels** first and smaller sizes if needed, and converted to WebP. The limit after preparation is **1 MiB per image**. GIFs are not automatically resized or converted: prepare them under the limit before uploading.

The server allows **20 uploads per hour per device**. Importing activities with embedded images also uses the upload service. If you have tried or replaced many images, wait before trying again.

## Use an image already online

Choose **Link** and paste an address starting with `https://`. Check that the image is public, available without signing in and allowed to be shared. A link to a page containing an image is not necessarily an image URL.

Do not use URLs with private tokens, sensitive temporary links or personal documents. The address is intended for use by Discord and remains in any activity export file.

## Understand local copies and hosting

- The Nowly panel displays local copies of uploaded files, avoiding a download for every preview.
- Discord receives a hosted URL. An image visible in the editor may therefore be missing from Discord if hosting or retrieval fails.
- The extension refreshes the active activity's images on activation and periodically afterwards.
- Hosted images unused for **30 days** may be removed by service cleanup. When needed, Nowly uploads them again from the local copy.
- Local copies matter: uninstalling the extension or clearing its data can remove them. [Export your activities](/guides/share-custom-activities) to keep copies elsewhere.

Activity exports embed uploaded images only if their local copies exist. Import uploads them again for the new device. Image links stay links: they are not converted into backups of the linked files.

## Resolve an image error

| Problem | What to check |
| --- | --- |
| This image is too large, even after resizing. | Reduce dimensions or quality with a local tool. For GIFs, also reduce animation frames or choose a still image. |
| Use a PNG, JPEG, WebP or GIF image. | Choose a supported format. Renaming a file extension does not convert its contents. |
| This file isn't a valid image. | Open the file locally, then export it again from your image tool. Nowly checks the real file signature too. |
| The image couldn't be sent. Try again or use a link. | Check your network, wait if you reached the upload limit, then retry. An unavailable image service can also prevent uploads. |
| An image could not be imported, it was left empty. | The activity was imported without that image. Replace it in the editor after checking the network and upload limit. |
| The preview looks right but Discord does not. | Check the Nowly Desktop connection, activity activation and public image access. Discord caching may delay a change; avoid repeatedly uploading in a loop. |

If no part of the activity appears on Discord, start with [Rich Presence not showing](/guides/rich-presence-not-showing) instead.

## Before publishing an image

Only use images you have permission to share and are comfortable showing to people who can see your activity. A local copy does not mean the image stays only on your device: **Upload** uses remote hosting and Discord may cache images. Custom activities are not synchronized with your account, but their sharing files can contain images.
