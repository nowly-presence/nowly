# Nowly web page templates

Gold files: `apps/web/app/library/page.tsx`, `apps/web/components/library/library-view.tsx`, `apps/web/components/support/support-view.tsx`.

## RSC page

```tsx
import { WebPageJsonLd } from "@/components/seo/web-page-json-ld"
import { ExampleView } from "@/components/example/example-view"
import { createMetadata } from "@/lib/seo"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("pages.example")
  return createMetadata({
    title: t("title"),
    description: t("description"),
    path: "/example",
  })
}

const Page = async () => {
  const t = await getTranslations("pages.example")
  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/example" />
      <ExampleView />
    </>
  )
}

export default Page
```

With data: fetch in the page (or in the RSC view) with `Promise.all`, pass props into a client view only if needed.

## Messages

`apps/web/messages/en-US.json` (mirror in `fr-FR` and `es-ES`):

```json
"pages": {
  "example": {
    "title": "Example",
    "description": "One sentence for the tab and Open Graph."
  }
},
"examplePage": {
  "eyebrow": "Example",
  "title": "Short title",
  "description": "One or two sentences. Periods, not em dashes."
}
```

## Card grid (support pattern)

```tsx
<a href={href} rel="noreferrer" target="_blank" className="block rounded-[16px] outline-offset-4">
  <Card className="h-full transition-colors hover:bg-foreground/6">
    <CardContent className="pt-6 pb-6">
      <Icon className="size-5 text-accent" />
      <CardTitle className="mt-4">{t("title")}</CardTitle>
      <CardDescription className="mt-2">{t("description")}</CardDescription>
    </CardContent>
  </Card>
</a>
```

Internal card: `Link` from `next/link` with the same `className`.

## Actions

```tsx
import { ButtonLink, ButtonAnchor, Button } from "@nowly/ui"

<ButtonLink href="/library" variant="outline">Library</ButtonLink>
<ButtonAnchor href="https://nowly.me/desktop" rel="noreferrer" target="_blank">
  Desktop app
</ButtonAnchor>
<Button type="button" onClick={onClear}>Clear</Button>
```

## Copy labels

| Locale | Desktop product name |
|--------|----------------------|
| en-US | Desktop app |
| fr-FR | Application bureau |
| es-ES | App de escritorio |

Never "Host" except when explaining that the old name was Host.

## What not to copy from library

- `useNavJoin`, `data-nav-join`, `--nav-join-panel` (sticky search fused under the floating marketing nav)
- `max-w-[1200px]` toolbar that exists only to align with that nav
- Home Ferris-wheel / marquee sections
