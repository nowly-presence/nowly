import { useRef, useState } from "react"
import { RiUploadCloud2Line } from "@remixicon/react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useFeatureReveals } from "@/hooks/feature-reveal-provider"
import { useI18n, type MessageKey } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import { useSeason } from "@/hooks/season-provider"
import { sendMessage } from "@/lib/messages"
import { IS_CANARY } from "@/shared/brand"
import { API_BASE_URL } from "@/shared/constants"
import { replayHalloweenPrank } from "@/shared/halloween-prank"
import { saveReviewPrompt } from "@/shared/review-prompt"
import { replaySeasonMoment } from "@/shared/season-moments"
import { ENABLED_SEASONS, isSeasonOverride, saveSeasonOverride, type Season } from "@/shared/seasonal-themes"
import { bytesToBase64 } from "@/shared/zip-bytes"
import { Button } from "@/ui/button"
import { FieldRow } from "@/ui/field-row"
import { Input } from "@/ui/input"
import { Row } from "@/ui/row"
import { Select } from "@/ui/select"
import { useToast } from "@/ui/toast"

const HTTP_URL = /^https?:\/\/.+/
const SEASON_AUTO = "auto"

const SEASON_LABELS: Record<Season, MessageKey> = {
  spring: "settings.seasonSpring",
  summer: "settings.seasonSummer",
  autumn: "settings.seasonAutumn",
  winter: "settings.seasonWinter",
  halloween: "settings.seasonHalloween",
  "new-year": "settings.seasonNewYear",
}

export const DeveloperTools = () => {
  const { state, refresh, updateSettings } = useExtensionState()
  const { t } = useI18n()
  const { push } = useNav()
  const { toast } = useToast()
  const { override } = useSeason()
  const reveals = useFeatureReveals()
  const [apiDraft, setApiDraft] = useState(state.settings.customApiBaseUrl ?? "")
  const [busy, setBusy] = useState<"zip" | "updates" | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const saveApi = async () => {
    const value = apiDraft.trim()
    if (value && !HTTP_URL.test(value)) {
      toast(t("error.invalidUrl"), "error")
      return
    }
    await updateSettings({ customApiBaseUrl: value || undefined })
    toast(t("toast.saved"))
  }

  const installZip = async (file: File) => {
    setBusy("zip")
    const bytes = bytesToBase64(new Uint8Array(await file.arrayBuffer()))
    const result = await sendMessage("INSTALL_LOCAL_PRESENCE_ZIP", { fileName: file.name, bytes })
    setBusy(null)
    await refresh.presences()
    if (result.ok) toast(t("toast.installed", { name: result.slug ?? file.name }))
    else toast(`${t("error.generic")} (${result.error})`, "error")
  }

  const checkUpdates = async () => {
    setBusy("updates")
    await refresh.updates()
    setBusy(null)
    toast(t("toast.updatesChecked"), "info")
  }

  const replayOnboarding = () =>
    void sendMessage("SET_ONBOARDING", { onboardingCompleted: false, devReplayOnboarding: true }).then(() => refresh.onboarding())

  return (
    <>
      <FieldRow title={t("settings.customApi")} layout="stacked" controlClassName="flex gap-2">
        <div className="flex-1">
          <Input value={apiDraft} onChange={(event) => setApiDraft(event.target.value)} placeholder={API_BASE_URL} aria-label={t("settings.customApi")} spellCheck={false} />
        </div>
        <Button variant="secondary" onClick={() => void saveApi()}>
          {t("action.save")}
        </Button>
      </FieldRow>
      <Row title={t("settings.logs")} onClick={() => push({ name: "logs" })} chevron />
      <Row
        title={t("settings.checkUpdates")}
        trailing={
          <Button size="sm" variant="secondary" loading={busy === "updates"} onClick={() => void checkUpdates()}>
            {t("action.check")}
          </Button>
        }
      />
      {IS_CANARY && (
        <Row
          title={t("settings.localZip")}
          description={t("settings.localZipHint")}
          trailing={
            <>
              <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={(event) => event.target.files?.[0] && void installZip(event.target.files[0])} />
              <Button size="sm" variant="secondary" loading={busy === "zip"} icon={<RiUploadCloud2Line className="size-4" />} onClick={() => fileRef.current?.click()}>
                {t("action.import")}
              </Button>
            </>
          }
        />
      )}
      {IS_CANARY && (
        <>
          <FieldRow title={t("settings.forceSeason")} controlClassName="w-44">
            <Select
              aria-label={t("settings.forceSeason")}
              value={override ?? SEASON_AUTO}
              onChange={(value) => void saveSeasonOverride(isSeasonOverride(value) ? value : null)}
              options={[
                { value: SEASON_AUTO, label: t("settings.seasonAuto") },
                ...ENABLED_SEASONS.map((season) => ({ value: season, label: t(SEASON_LABELS[season]) })),
                { value: "none", label: t("settings.seasonNone") },
              ]}
            />
          </FieldRow>
          <Row
            title={t("settings.replayPrank")}
            trailing={
              <Button size="sm" variant="secondary" onClick={() => void replayHalloweenPrank()}>
                {t("action.replay")}
              </Button>
            }
          />
          <Row
            title={t("settings.replayMoment")}
            description={t("settings.replayMomentHint")}
            trailing={
              <Button size="sm" variant="secondary" onClick={() => void replaySeasonMoment()}>
                {t("action.replay")}
              </Button>
            }
          />
          <Row
            title={t("settings.replayReveals")}
            description={t("settings.replayRevealsHint")}
            trailing={
              <Button size="sm" variant="secondary" onClick={reveals.replay}>
                {t("action.replay")}
              </Button>
            }
          />
        </>
      )}
      <Row
        title={t("settings.replayReview")}
        trailing={
          <Button size="sm" variant="secondary" onClick={() => void saveReviewPrompt({ firstSeenAt: 0 })}>
            {t("action.replay")}
          </Button>
        }
      />
      <Row
        title={t("settings.replayOnboarding")}
        trailing={
          <Button size="sm" variant="secondary" onClick={replayOnboarding}>
            {t("action.replay")}
          </Button>
        }
      />
    </>
  )
}
