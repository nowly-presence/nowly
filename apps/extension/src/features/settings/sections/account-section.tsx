import { useState } from "react"
import { RiDiscordFill, RiExternalLinkLine, RiRefreshLine } from "@remixicon/react"
import { DiscordAvatar } from "@/components/shared/discord-avatar"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { useNow } from "@/hooks/use-now"
import { formatRelative } from "@/lib/format"
import { sendMessage } from "@/lib/messages"
import { openUrl, siteUrl } from "@/shared/browser-links"
import type { AccountSnapshot, AccountUser } from "@/shared/types"
import { Button } from "@/ui/button"
import { Group } from "@/ui/card"
import { Row } from "@/ui/row"
import { Section } from "@/ui/section"
import { Sheet } from "@/ui/sheet"
import { useToast } from "@/ui/toast"
import { AccountChoiceSheet } from "@/features/settings/account-choice-sheet"

const AVATAR_SIZE = 36
const MINUTE_MS = 60_000

type Busy = "connect" | "sync" | "signOut" | "stop" | null

const AccountAvatar = ({ user }: { user: AccountUser }) => {
  const [failed, setFailed] = useState(false)
  if (!user.image || failed) return <DiscordAvatar size={AVATAR_SIZE} />
  return (
    <img
      src={user.image}
      alt=""
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      onError={() => setFailed(true)}
      className="size-9 shrink-0 rounded-full object-cover"
    />
  )
}

const SignedOut = ({ busy, onConnect }: { busy: Busy; onConnect: () => void }) => {
  const { t } = useI18n()
  return (
    <Group>
      <Row align="start" title={t("account.signedOutTitle")} description={t("account.signedOutHint")} />
      <div className="px-4 py-3">
        <Button variant="secondary" className="w-full" loading={busy === "connect"} icon={<RiDiscordFill className="size-4" />} onClick={onConnect}>
          {t("account.signIn")}
        </Button>
      </div>
    </Group>
  )
}

const SyncStatus = ({ account }: { account: Extract<AccountSnapshot, { signedIn: true }> }) => {
  const { t, locale } = useI18n()
  const now = useNow(MINUTE_MS)
  if (account.pendingChoice) return <>{t("account.choicePending")}</>
  if (account.error) return <span className="text-danger">{t("account.syncError")}</span>
  if (!account.lastSyncedAt) return <>{t("account.neverSynced")}</>
  if (now - account.lastSyncedAt < MINUTE_MS) return <>{t("account.syncedJustNow")}</>
  return <>{t("account.lastSync", { time: formatRelative(account.lastSyncedAt, now, locale) })}</>
}

export const AccountSection = () => {
  const { state, patch } = useExtensionState()
  const { t } = useI18n()
  const { toast } = useToast()
  const [busy, setBusy] = useState<Busy>(null)
  const [stopOpen, setStopOpen] = useState(false)
  const [choiceOpen, setChoiceOpen] = useState(false)
  const account = state.account

  const run = async <T,>(kind: Exclude<Busy, null>, action: () => Promise<T>): Promise<T | null> => {
    setBusy(kind)
    try {
      return await action()
    } catch {
      toast(t("error.generic"), "error")
      return null
    } finally {
      setBusy(null)
    }
  }

  const connect = () =>
    void run("connect", () => sendMessage("START_ACCOUNT_CONNECT")).then((result) => {
      if (result?.ok) toast(t("account.signInOpened"), "info")
    })

  const syncNow = () =>
    void run("sync", () => sendMessage("SYNC_ACCOUNT")).then((next) => {
      if (!next) return
      patch({ account: next })
      if (next.signedIn && !next.error && !next.pendingChoice) toast(t("toast.synced"), "success")
    })

  const signOut = () =>
    void run("signOut", () => sendMessage("SIGN_OUT_ACCOUNT")).then((next) => {
      if (!next) return
      patch({ account: next })
      toast(t("toast.signedOut"))
    })

  const stopSync = () =>
    void run("stop", () => sendMessage("STOP_ACCOUNT_SYNC")).then((result) => {
      if (!result) return
      setStopOpen(false)
      if (!result.ok) {
        toast(t("account.syncError"), "error")
        return
      }
      patch({ account: { signedIn: false } })
      toast(t("toast.syncStopped"))
    })

  return (
    <Section title={t("settings.account")}>
      {!account.signedIn ? (
        <SignedOut busy={busy} onConnect={connect} />
      ) : (
        <Group>
          <Row
            leading={<AccountAvatar user={account.user} />}
            title={account.user.name}
            description={<SyncStatus account={account} />}
            trailing={
              account.pendingChoice ? (
                <Button size="sm" variant="secondary" onClick={() => setChoiceOpen(true)}>
                  {t("action.choose")}
                </Button>
              ) : (
                <Button size="sm" variant="secondary" aria-label={t("account.syncNow")} title={t("account.syncNow")} loading={busy === "sync"} icon={<RiRefreshLine className="size-4" />} onClick={syncNow}>
                  {t("action.sync")}
                </Button>
              )
            }
          />
          <Row title={t("account.manage")} onClick={() => openUrl(siteUrl("/account"))} trailing={<RiExternalLinkLine className="size-4 text-muted" />} />
          <Row
            align="start"
            title={<span className="whitespace-normal">{t("account.signOutTitle")}</span>}
            description={t("account.signOutHint")}
            trailing={
              <Button size="sm" variant="secondary" loading={busy === "signOut"} onClick={signOut}>
                {t("action.signOut")}
              </Button>
            }
          />
          <Row
            align="start"
            title={<span className="whitespace-normal">{t("account.stop")}</span>}
            description={t("account.stopHint")}
            trailing={
              <Button size="sm" variant="danger" onClick={() => setStopOpen(true)}>
                {t("action.erase")}
              </Button>
            }
          />
        </Group>
      )}
      <AccountChoiceSheet open={choiceOpen} onClose={() => setChoiceOpen(false)} />
      <Sheet
        open={stopOpen}
        onClose={() => setStopOpen(false)}
        title={t("account.stopTitle")}
        description={t("account.stopDescription")}
        closeLabel={t("action.close")}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setStopOpen(false)}>
              {t("action.cancel")}
            </Button>
            <Button variant="destructive" className="flex-1" loading={busy === "stop"} onClick={stopSync}>
              {t("action.erase")}
            </Button>
          </>
        }
      />
    </Section>
  )
}
