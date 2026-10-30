# Assets

- `GET /presences/:slug/assets/:type` only serves what is already stored; assets are uploaded by the internal CLI from the presences repository.
- A new type needs the allow-list entry in `assets.routes.ts` and its resolution in `assets.service.ts`.
