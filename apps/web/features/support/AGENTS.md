# Support

`/support` is the single help, contact and donation page (there is no `/contact`).

- `#contact` and `#donate` are public anchors used by the extension, the home page, the footer and About: keep both ids.
- New support link: add it to `SUPPORT_LINKS` (`lib/support-links.ts`) and use it in `support-view.tsx`. `githubIssueUrl(repo, template)` does not validate the template: the file must exist in the target repository's `.github/ISSUE_TEMPLATE/`.
- The contact form posts to the API's `contact` feature through `presenceApiBaseUrl()`; delivery is configured there.
