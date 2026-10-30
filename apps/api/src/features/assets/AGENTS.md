# Assets

`GET /presences/:slug/assets/:type` serves a presence's assets from CDN/storage. Allowed types are `logo`, `icon` and `thumbnail`, validated in `assets.routes.ts`.

- A new type needs the allow-list entry in the route and the resolution in `assets.service.ts`.
- This feature only serves what is already stored; assets are published from the presences repository through the internal CLI's R2 sync.
