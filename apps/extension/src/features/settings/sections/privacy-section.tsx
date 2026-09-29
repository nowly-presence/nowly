import { useState } from "react"
import { RiDownload2Line } from "@remixicon/react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { sendMessage, track } from "@/lib/messages"
import { Button } from "@/ui/button"
import { Group } from "@/ui/card"
import { Row, SwitchRow } from "@/ui/row"
import { Section } from "@/ui/section"
import { Sheet } from "@/ui/sheet"
import { useToast } from "@/ui/toast"
import { exportDeviceData } from "@/features/settings/export-device-data"

export const PrivacySection = () => {
  const { state, refresh } = useExtensionState()
  const { t } = useI18n()
  const { toast } = useToast()
  const [busy, setBusy] = useState<"export" | "delete" | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const setConsent = async (granted: boolean) => {
    if (!granted) track("analytics_consent_changed", { source: "extension_settings", payload: { enabled: false, source: "extension_settings" } })
    await sendMessage("SET_ANALYTICS_CONSENT", { granted })
    await refresh.consent()
  }

  const exportData = async () => {
    setBusy("export")
    const ok = await exportDeviceData(Object.keys(state.presences))
    setBusy(null)
    toast(ok ? t("toast.exported") : t("error.generic"), ok ? "success" : "error")
  }

  const deleteData = async () => {
    setBusy("delete")
    const result = await sendMessage("DELETE_DEVICE_DATA")
    setBusy(null)
    setDeleteOpen(false)
    toast(result.ok ? t("toast.deleted") : t("error.generic"), result.ok ? "success" : "error")
  }

  return (
    <Section title={t("settings.privacy")}>
      <Group>
        <SwitchRow
          align="start"
          title={t("settings.analytics")}
          description={t("settings.analyticsHint")}
          checked={state.analyticsConsent}
          label={t("settings.analytics")}
          onChange={(checked) => void setConsent(checked)}
        />
        <Row
          title={t("settings.export")}
          description={t("settings.exportHint")}
          trailing={
            <Button size="sm" variant="secondary" loading={busy === "export"} icon={<RiDownload2Line className="size-4" />} onClick={() => void exportData()}>
              {t("action.export")}
            </Button>
          }
        />
        <Row
          title={t("settings.delete")}
          description={t("settings.deleteHint")}
          trailing={
            <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
              {t("action.delete")}
            </Button>
          }
        />
      </Group>
      <Sheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t("settings.deleteTitle")}
        description={t("settings.deleteDescription")}
        closeLabel={t("action.close")}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)}>
              {t("action.cancel")}
            </Button>
            <Button variant="destructive" className="flex-1" loading={busy === "delete"} onClick={() => void deleteData()}>
              {t("action.delete")}
            </Button>
          </>
        }
      />
    </Section>
  )
}
