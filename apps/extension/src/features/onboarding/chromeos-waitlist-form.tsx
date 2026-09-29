import { useState } from "react"
import { RiMailLine } from "@remixicon/react"
import { API_BASE_URL, CHROMEOS_WAITLIST_CAMPAIGN_ID } from "@/shared/constants"
import { useI18n } from "@/hooks/i18n-provider"
import { Button } from "@/ui/button"
import { Card } from "@/ui/card"
import { Input } from "@/ui/input"

export const ChromeOsWaitlistForm = (): React.JSX.Element | null => {
  const { t } = useI18n()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")

  if (!CHROMEOS_WAITLIST_CAMPAIGN_ID) return null

  const submit = async (): Promise<void> => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || status === "sending") return
    setStatus("sending")

    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${CHROMEOS_WAITLIST_CAMPAIGN_ID}/signups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      })
      if (!response.ok) {
        setStatus("error")
        return
      }
      setStatus("success")
    } catch {
      setStatus("error")
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <span className="text-label-lg font-medium">{t("onboarding.chromeOsWaitlistTitle")}</span>
        <span className="text-body-sm text-muted">{t("onboarding.chromeOsWaitlistDescription")}</span>
      </div>
      {status === "success" ? (
        <p className="text-body-sm text-success">{t("onboarding.chromeOsWaitlistSuccess")}</p>
      ) : (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <label className="text-label-md text-muted" htmlFor="chromeos-waitlist-email">
            {t("onboarding.chromeOsWaitlistEmail")}
          </label>
          <Input
            id="chromeos-waitlist-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("onboarding.chromeOsWaitlistPlaceholder")}
            leading={<RiMailLine className="size-4" />}
            aria-invalid={status === "error"}
          />
          {status === "error" && <p className="text-body-sm text-danger">{t("onboarding.chromeOsWaitlistError")}</p>}
          <Button type="submit" loading={status === "sending"}>
            {t("onboarding.chromeOsWaitlistSubmit")}
          </Button>
        </form>
      )}
    </Card>
  )
}
