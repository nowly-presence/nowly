import { RiCheckboxCircleLine } from "@remixicon/react"
import { t } from "@/shared/i18n"

type Props = {
  features: string[]
  urls: string[]
}

const toHref = (url: string): string => (url.includes("://") ? url : `https://${url}`)

export const PresenceAboutCard = ({ features, urls }: Props): React.JSX.Element | null => {
  if (features.length === 0 && urls.length === 0) return null

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card px-4 py-3">
      {features.length > 0 ? (
        <div>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("presence-features")}</h2>
          <ul className="flex flex-col gap-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm leading-5 text-muted-foreground">
                <RiCheckboxCircleLine className="size-5 shrink-0 text-accent" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {urls.length > 0 ? (
        <div>
          <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("presence-supported-urls")}</h2>
          <div className="flex flex-wrap gap-1.5">
            {urls.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => void chrome.tabs.create({ url: toHref(url) })}
                className="inline-flex max-w-full truncate rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {url}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
