import { useState } from "react"
import { RiCloudLine, RiComputerLine } from "@remixicon/react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { sendMessage } from "@/lib/messages"
import type { SyncChoice } from "@/shared/types"
import { Spinner } from "@/ui/button"
import { Group } from "@/ui/card"
import { Row } from "@/ui/row"
import { Sheet } from "@/ui/sheet"
import { useToast } from "@/ui/toast"

const ICON_CLASS = "size-[18px] text-muted"

export const AccountChoiceSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { patch } = useExtensionState()
  const { t } = useI18n()
  const { toast } = useToast()
  const [busy, setBusy] = useState<SyncChoice | null>(null)

  const choose = async (choice: SyncChoice) => {
    setBusy(choice)
    const account = await sendMessage("RESOLVE_SYNC_CHOICE", { choice }).catch(() => null)
    setBusy(null)
    if (!account) {
      toast(t("error.generic"), "error")
      return
    }
    patch({ account })
    if (account.signedIn && !account.pendingChoice && !account.error) toast(t("toast.synced"), "success")
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={t("account.choiceTitle")} description={t("account.choiceDescription")} closeLabel={t("action.close")}>
      <Group>
        <Row
          leading={<RiCloudLine className={ICON_CLASS} />}
          align="start"
          title={t("account.keepAccount")}
          description={t("account.keepAccountHint")}
          trailing={busy === "account" ? <Spinner /> : undefined}
          chevron={busy === null}
          onClick={busy === null ? () => void choose("account") : undefined}
        />
        <Row
          leading={<RiComputerLine className={ICON_CLASS} />}
          align="start"
          title={t("account.keepDevice")}
          description={t("account.keepDeviceHint")}
          trailing={busy === "device" ? <Spinner /> : undefined}
          chevron={busy === null}
          onClick={busy === null ? () => void choose("device") : undefined}
        />
      </Group>
    </Sheet>
  )
}

export const AccountChoicePrompt = () => {
  const { state } = useExtensionState()
  const [dismissed, setDismissed] = useState(false)
  const pending = state.ready && state.account.signedIn && state.account.pendingChoice
  return <AccountChoiceSheet open={pending && !dismissed} onClose={() => setDismissed(true)} />
}
