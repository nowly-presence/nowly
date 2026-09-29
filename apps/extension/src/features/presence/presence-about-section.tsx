import { RiCheckLine } from "@remixicon/react"
import { useI18n } from "@/hooks/i18n-provider"
import type { PresenceView } from "@/lib/presence-view"
import { Section } from "@/ui/section"

export const PresenceAboutSection = ({ view }: { view: PresenceView }) => {
  const { t } = useI18n()
  const description = view.longDescription || view.description
  if (!description && view.features.length === 0) return null

  return (
    <Section title={t("detail.about")}>
      <div className="flex flex-col gap-4 px-1">
        {description && <p className="text-body-sm text-ink/85">{description}</p>}
        {view.features.length > 0 && (
          <ul className="flex flex-col gap-2">
            {view.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-body-sm">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <RiCheckLine className="size-3" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  )
}
