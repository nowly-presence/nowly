# Store

The catalog of installable presences. `store-view.tsx` lists it, `store-detail.tsx` shows one presence before install, `install-queue-banner.tsx` shows install progress.

## Add a new catalog field/filter (e.g. filter by category)

1. Add the field to `StorePresence` in `store.model.ts`, and to `toStorePresence()`'s mapping from the raw API response.
2. `use-presence-catalog.ts` caches the catalog for 5 minutes (`CATALOG_TTL_MS`) in a module-level `catalogCache` — a new field will only show up after that cache expires or `refetch()` is called with `force: true`; don't add a second caching layer on top.
3. Add the filter UI to `store-view.tsx`, filtering the `items` array client-side (the catalog is fetched in full, there's no server-side filter param today).
4. If the field doesn't exist yet in the API response, it must be added to the `presence` feature's `GET /` in `apps/api` first (see that feature's `AGENTS.md` — `getPresenceListData` is where the aggregated fields come from).

## Notable dependencies
`presence` feature of `apps/api` (`GET /`, via `FETCH_PRESENCE_CATALOG` message to the `background/`), `background/managers` (triggers the actual install once a presence is picked).
