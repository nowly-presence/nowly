# Views

The analytics dashboard: saved views, widgets (stat/chart/funnel), view editor. Rendered by `app/(dashboard)/page.tsx` (overview) and `app/(dashboard)/views/**`.

## Add a new default (predefined) view

1. Add the slug to `DEFAULT_VIEW_SLUGS` and its sidebar label to `DEFAULT_VIEW_LABELS` in `lib/default-views.ts`.
2. Add the `ViewConfig` (name + `widgets` array) to `DEFAULT_VIEWS` in the same file — each widget needs an `id`, `title`, `kind` (`"metric-series"` or `"funnel"`), and either a `metric` (for `metric-series`, plus `chartType`: `"line"`/`"bar"`) or a `funnelId` (for `funnel`), plus `filters`/`range`.
3. `features/layout/components/app-sidebar.tsx` reads `DEFAULT_VIEW_SLUGS`/`DEFAULT_VIEW_LABELS` directly — no separate registration needed there.
4. If the widget references a new metric/funnel that doesn't exist yet in the analytics pipeline, it must first exist in `packages/analytics`'s schema and be emitted by whatever client (`apps/extension`, `apps/web`, `apps/api`) is supposed to send it.

## Add a new widget type

1. Add the new `kind` to `ViewConfig`'s widget union in `packages/analytics` (source of truth for widget shapes).
2. Create `widget-<kind>.tsx` in `features/views/components/`, following an existing one like `widget-funnel.tsx`.
3. Add the case to `widget-renderer.tsx`'s switch/branch — that's the only place that dispatches a widget config to its component.
4. Add the new kind's editing UI to `widget-editor-dialog.tsx` if it needs configuration beyond what `filter-fields.tsx` already covers.

## Notable dependencies
`lib/catalog.ts` (root, shared with `chat` — lists available metrics/dimensions), `features/api-target` (executes the actual queries), `packages/analytics` (`ViewConfig` schema).
