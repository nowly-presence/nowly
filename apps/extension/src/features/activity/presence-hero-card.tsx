import { useState, type ReactNode } from "react"
import { assetUrl } from "@/shared/api"

type Props = {
  children: ReactNode
  color: string
  footer?: ReactNode
  slug: string
}

export const PresenceHeroCard = ({ children, footer, slug }: Props): React.JSX.Element => {
  const [banner, setBanner] = useState(true)

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-card">
      {banner ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden">
          <img
            src={assetUrl(slug, "thumbnail")}
            alt=""
            aria-hidden="true"
            className="size-full object-cover opacity-45"
            onError={() => setBanner(false)}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-card/75 to-card" />
        </div>
      ) : null}
      <div className={banner ? "relative z-10 p-4 pt-16" : "relative z-10 p-4"}>{children}</div>
      {footer}
    </section>
  )
}
