import { RiCodeSSlashLine, RiPulseLine } from "@remixicon/react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import { Group } from "@/ui/card"
import { Row, SwitchRow } from "@/ui/row"
import { Section } from "@/ui/section"
import { DeveloperTools } from "@/features/settings/sections/developer-tools"

export const AdvancedSection = () => {
  const { state, updateSettings } = useExtensionState()
  const { t } = useI18n()
  const { push } = useNav()

  return (
    <Section title={t("settings.advanced")}>
      <Group>
        <Row leading={<RiPulseLine className="size-[18px] text-muted" />} title={t("settings.diagnostics")} description={t("settings.diagnosticsHint")} onClick={() => push({ name: "connection" })} chevron />
        <SwitchRow
          leading={<RiCodeSSlashLine className="size-[18px] text-muted" />}
          title={t("settings.developer")}
          description={t("settings.developerHint")}
          checked={state.settings.developerMode === true}
          label={t("settings.developer")}
          onChange={(checked) => void updateSettings({ developerMode: checked })}
        />
        {state.settings.developerMode && <DeveloperTools />}
      </Group>
    </Section>
  )
}
