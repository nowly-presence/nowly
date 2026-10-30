# Layout

`navbar.tsx` and `footer.tsx` are thin wrappers around `@nowly/ui`: change links, labels and presentation in `packages/ui` (see `packages/ui/AGENTS.md`) and keep only app routing and the download button here. Docs links stay local; marketing links and the brand go to localized nowly.me URLs. A footer that differs from web's is a bug in `packages/ui`.
