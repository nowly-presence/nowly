# Presence creator

The presence creator lets anyone build a presence for a site that has none, without writing code, directly from the extension side panel. The finished presence is sent for review and, once approved, published like any other presence.

This page explains how the creator works. The server side (submission, review, publication) is specified in [`README.md`](./README.md).

## Key principle: no code from users

The creator does not produce code. It produces a **declarative definition**: visuals, name, domains, colour, texts, and for each page an address, the elements to read (CSS selector, tab title, sharing tags) and text templates such as `Watching {title}`.

The presence files (`metadata.json`, `presence.ts`, `locales/*.json`) are **generated** from this definition by a deterministic generator (`src/shared/creator/`). The server never trusts files it receives: it regenerates everything with the same generator. A selector or a text can never become code, since every value is inserted with `JSON.stringify`.

The generated files are checked against the real SDK: `presence.ts` compiles with the presences repository `tsconfig`, the locales pass `scripts/validate-locales.ts` and `metadata.json` passes `metadata.schema.json`.

## The wizard

| Step | Content |
|---|---|
| Entry | A "Your site isn't here?" card at the end of the library, a button in the empty search, and a "Create a presence" button above the dock while the library is open. |
| Visuals | Banner 1920×1080 JPG, logo 300×300 PNG (with background), icon 128×128 PNG (transparent). Images are cropped and resized to the exact sizes the CI expects, the icon transparency is detected, upscaling is flagged, the banner rights must be confirmed, and a colour is suggested from the logo. |
| Identity | Name, domains (the current tab's site is suggested when it has no presence yet), colour, category. |
| Language | Writing language (the browser's by default), then "Translate automatically" or "Translate myself" (English required). |
| Descriptions | Short and long description, up to 5 features of 80 characters, per language when translating manually. |
| Pages | A list of page types, reordered by drag and drop. Each page has an address rule (starts with, is exactly, contains, any), an activity type, the elements read on the page, a first and second line, an optional button, an image and a timestamp (time on the page by default, or the player progress). |
| Element picker | "Pick on the page" opens an overlay in the tab: hover to highlight, click to pick, ↑/↓ to widen or narrow the selection, Escape to cancel. It builds a stable CSS selector (id, stable attributes, non-generated classes, `nth-of-type`). |
| Live test | Reads the tab every 3 s with exactly the rules of the generated code, shows the Discord card, and can show it on the real Discord during the test. |
| Review and send | A summary per step, sign-in with a Nowly account, sending, status tracking, the generated files and a zip export. |

Drafts stay in the browser (`chrome.storage.local`) until they are sent.

### Limits

The creator covers common sites. For anything beyond these limits, export the zip and continue in code:

- no reading through a site API or the page's internal data;
- no conditional logic beyond "first matching page";
- no iframes;
- one button per page;
- presence settings limited to "Show buttons" and "Show browsing activity".

## Review and publication

```
Extension                    API / website                      GitHub
---------                    -------------                      ------
Local draft
   |
Send  ---------------->  Submission "Waiting for review"
                          listed on nowly.me/requests (votes)
                                   |
                          Moderator: approve, request changes or reject
                                   |
                          Job: regenerates the files,  ------->  Nolo bot opens a PR
                          translates when asked                  (labels presence, creator)
                          status "Being added" + PR link              |
                                   |                             CI: assets, locales, tsc
                                   |                             Merge
                                   |                                   |
                          "published" webhook  <--------------  Presences CI (CDN push)
                          status "Published"
```

| Status | Set by | Shown as |
|---|---|---|
| `submitted` | Sending from the extension | Waiting for review |
| `changes_requested` | Moderator, with a note | Changes requested (the author edits and sends again) |
| `approved` | Moderator | Approved |
| `in_progress` | PR opened by Nolo | Being added |
| `published` | CI webhook after the CDN push | Published |
| `rejected` | Moderator, with a note | Rejected |

Anyone signed in can request a site or vote on proposed presences at `nowly.me/requests`. Votes only sort the moderation queue; they never approve a presence.

## Authors

Signing in is required to send, and the signed-in account is the author: there is no author field. The creator uses the extension's Nowly account (Discord sign-in) with its explicit `creator` permission, the same one as public activities.

- With Discord: `author: { name, discord }`, where `discord` is the Discord user id.
- With GitHub, once supported: `author: { name, github }`.

Presence pages link to `github.com/<github>` when `github` is set, otherwise to `discord.com/users/<discord>`.

## Security

- The server always regenerates the files and rebuilds the definition field by field.
- Texts, pages, elements and images are size-limited; images are checked by content and re-encoded.
- Custom addresses (image, button link) must start with `https://`.
- The generated presence only reads the page DOM and makes no network request.
- Submissions and votes are rate-limited per account.
- Moderators check banner rights, trademarks and texts before approving.
