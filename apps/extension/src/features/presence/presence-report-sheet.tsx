import { useState } from "react"
import { useI18n } from "@/hooks/i18n-provider"
import { sendMessage } from "@/lib/messages"
import { PRESENCE_REPORT_MAX_LENGTH } from "@/shared/constants"
import { LOCALE_LONG_MAP } from "@/shared/locales"
import { Button } from "@/ui/button"
import { Sheet } from "@/ui/sheet"
import { Textarea } from "@/ui/textarea"
import { useToast } from "@/ui/toast"

type PresenceReportSheetProps = { slug: string; name: string; open: boolean; onClose: () => void }

export const PresenceReportSheet = ({ slug, name, open, onClose }: PresenceReportSheetProps) => {
  const { t, locale } = useI18n()
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const submit = async () => {
    setSending(true)
    const result = await sendMessage("REPORT_PRESENCE", { slug, message, locale: LOCALE_LONG_MAP[locale] }).catch(() => ({ ok: false }))
    setSending(false)
    if (!result.ok) {
      toast(t("error.report"), "error")
      return
    }
    toast(t("toast.reportSent"))
    setMessage("")
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("report.title", { name })}
      description={t("report.description")}
      closeLabel={t("action.close")}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t("action.cancel")}
          </Button>
          <Button className="flex-1" disabled={!message.trim()} loading={sending} onClick={() => void submit()}>
            {t("report.send")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <Textarea
          value={message}
          maxLength={PRESENCE_REPORT_MAX_LENGTH}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t("report.placeholder")}
          aria-label={t("report.title", { name })}
          autoFocus
        />
        <span className="self-end text-label-sm text-muted tabular-nums">
          {message.length}/{PRESENCE_REPORT_MAX_LENGTH}
        </span>
      </div>
    </Sheet>
  )
}
