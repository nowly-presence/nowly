import type { Handler } from "@/background/router/router"
import {
  connectAccount,
  getAccountSnapshot,
  openAccountConnect,
  resolveSyncChoice,
  runAccountSync,
  signOutAccount,
  stopAccountSync,
} from "@/background/services/account-sync"

export const handleGetAccount: Handler<"GET_ACCOUNT"> = () => getAccountSnapshot()

export const handleStartAccountConnect: Handler<"START_ACCOUNT_CONNECT"> = async () => {
  await openAccountConnect()
  return { ok: true }
}

export const handleNowlySession: Handler<"NOWLY_SESSION"> = (payload) => connectAccount(payload)

export const handleSyncAccount: Handler<"SYNC_ACCOUNT"> = async () => {
  await runAccountSync("full")
  return getAccountSnapshot()
}

export const handleResolveSyncChoice: Handler<"RESOLVE_SYNC_CHOICE"> = async ({ choice }) => {
  await resolveSyncChoice(choice)
  return getAccountSnapshot()
}

export const handleSignOutAccount: Handler<"SIGN_OUT_ACCOUNT"> = async () => {
  await signOutAccount()
  return getAccountSnapshot()
}

export const handleStopAccountSync: Handler<"STOP_ACCOUNT_SYNC"> = () => stopAccountSync()
