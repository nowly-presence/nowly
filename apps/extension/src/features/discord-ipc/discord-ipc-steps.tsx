import { RiShieldCheckLine } from "@remixicon/react"
import type { MessageKey } from "@/hooks/i18n-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { Card } from "@/ui/card"
import { Section } from "@/ui/section"

const STEPS: MessageKey[] = ["discordIpc.step1", "discordIpc.step2", "discordIpc.step3"]

export const DiscordIpcSteps = () => {
  const { t } = useI18n()

  return (
    <Section title={t("discordIpc.stepsTitle")}>
      <Card className="p-4">
        <ol className="flex flex-col gap-4">
          {STEPS.map((key, index) => (
            <li key={key} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-hover text-label-md font-medium text-ink">{index + 1}</span>
              <span className="pt-0.5 text-body-sm text-ink">{t(key)}</span>
            </li>
          ))}
        </ol>
      </Card>
      <div className="flex gap-2.5 px-1 pt-1 text-muted">
        <RiShieldCheckLine className="mt-0.5 size-4 shrink-0" />
        <p className="text-body-sm">{t("discordIpc.safety")}</p>
      </div>
    </Section>
  )
}
