# Chat

The dashboard's AI assistant (Vercel AI SDK). `chat-panel.tsx` is the UI, `lib/instructions.ts` the system prompt, `lib/tools.ts` the tools exposed to the model, `app/api/chat/route.ts` wires them together server-side.

## Add a new tool for the AI

1. In `lib/tools.ts`, add an entry to the object returned by `insightsTools(opts)` (around line 73), following the existing pattern:
   ```ts
   myNewTool: tool({
     description: "One sentence the model uses to decide when to call this — be explicit about when NOT to call it if it's ambiguous (see generateView's description for an example).",
     inputSchema: z.object({ /* zod schema */ }),
     execute: async (input) => call("/insights/your-endpoint?..."),
   }),
   ```
2. If it needs a new API endpoint, add it to `apps/api`'s `insights` feature first — `call()` here just proxies to `${apiBaseUrl}${path}` through `features/api-target`.
3. Mention the new tool in `lib/instructions.ts` if the model needs guidance on *when* to prefer it over an existing one (e.g. `listCatalog` before `getMetricSeries` for an unfamiliar metric key).
4. No registration elsewhere — `insightsTools(opts)`'s return value is passed directly to the AI SDK's `streamText`/`generateText` call in `app/api/chat/route.ts`.

## Gotchas
- `generateView` and `createView` both accept a `widget: widgetSchema` (a `z.discriminatedUnion` over `metric-total`/`metric-series`/`funnel`) — if you add a new widget kind to `features/views` (see that feature's `AGENTS.md`), add the matching branch to `widgetSchema` here too, or the model will never be able to generate that widget type through chat.
- Tool descriptions are the *only* thing the model uses to decide which tool to call — an ambiguous description (e.g. not saying "never call this for X") is a bug, not a documentation nitpick.

## Notable dependencies
`lib/catalog.ts` (root, shared with `views` — supplies `FUNNEL_IDS`/metric keys), `@nowly/analytics` (`analyticsRegistry`, `ANALYTICS_RANGE_IDS`, `ANALYTICS_SOURCES`), `features/api-target`, Vercel AI SDK.
