import { EXTENSION_TOKEN_SCOPES, type ExtensionTokenScope } from "@nowly/shared"
import { STORAGE_KEYS } from "@/background/storage/keys"
import type { AccountUser, StoredAccount } from "@/shared/types"

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value)

const isScope = (value: unknown): value is ExtensionTokenScope =>
  typeof value === "string" && (EXTENSION_TOKEN_SCOPES as readonly string[]).includes(value)

export const parseAccountUser = (value: unknown): AccountUser | null => {
  if (!isObject(value) || typeof value.id !== "string" || typeof value.name !== "string") return null
  return {
    id: value.id,
    name: value.name,
    image: typeof value.image === "string" ? value.image : null,
    discordId: typeof value.discordId === "string" ? value.discordId : null,
  }
}

const parseStoredAccount = (value: unknown): StoredAccount | null => {
  if (!isObject(value) || typeof value.token !== "string" || typeof value.expiresAt !== "number") return null
  const user = parseAccountUser(value.user)
  if (!user) return null
  return {
    token: value.token,
    user,
    scopes: Array.isArray(value.scopes) ? value.scopes.filter(isScope) : [],
    expiresAt: value.expiresAt,
    connectedAt: typeof value.connectedAt === "number" ? value.connectedAt : 0,
  }
}

export const getAccount = async (): Promise<StoredAccount | null> => {
  const result = await chrome.storage.local.get(STORAGE_KEYS.account)
  return parseStoredAccount(result[STORAGE_KEYS.account])
}

export const setAccount = (account: StoredAccount): Promise<void> => chrome.storage.local.set({ [STORAGE_KEYS.account]: account })

export const updateAccountUser = async (user: AccountUser): Promise<void> => {
  const account = await getAccount()
  if (account) await setAccount({ ...account, user })
}

export const clearAccount = (): Promise<void> => chrome.storage.local.remove(STORAGE_KEYS.account)
