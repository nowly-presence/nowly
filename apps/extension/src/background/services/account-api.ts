import { addRuntimeLog } from "@/background/runtime-logs"
import { getEffectiveApiUrl } from "@/background/services/api-state"
import { parseAccountUser } from "@/background/storage/account.store"
import type { ExtensionSyncKey } from "@/shared/account-sync"
import type { AccountUser } from "@/shared/types"

export type RemoteSyncDocument = { key: string; value: unknown; version: number; updatedAt: string }

export type RemoteVersion = { value: unknown; version: number }

export type ApiResult<T> =
  | { status: "ok"; data: T }
  | { status: "unauthorized" }
  | { status: "conflict"; remote: RemoteVersion | null }
  | { status: "network" }
  | { status: "server"; code: number }

const HTTP_UNAUTHORIZED = 401
const HTTP_CONFLICT = 409

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value)

const parseDocument = (value: unknown): RemoteSyncDocument | null =>
  isObject(value) && typeof value.key === "string" && typeof value.version === "number" && typeof value.updatedAt === "string"
    ? { key: value.key, value: value.value, version: value.version, updatedAt: value.updatedAt }
    : null

const request = async <T>(
  token: string,
  method: "GET" | "PUT" | "POST" | "DELETE",
  path: string,
  parse: (body: unknown) => T | null,
  options: { body?: unknown; headers?: Record<string, string> } = {},
): Promise<ApiResult<T>> => {
  let response: Response
  try {
    response = await fetch(`${getEffectiveApiUrl()}${path}`, {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch (error) {
    addRuntimeLog("warn", "api", `${method} ${path} failed`, { error: error instanceof Error ? error.message : String(error) })
    return { status: "network" }
  }
  const body: unknown = await response.json().catch(() => null)
  if (response.status === HTTP_UNAUTHORIZED) return { status: "unauthorized" }
  if (response.status === HTTP_CONFLICT) {
    const remote = isObject(body) && typeof body.version === "number" && body.version > 0 ? { value: body.value, version: body.version } : null
    return { status: "conflict", remote }
  }
  if (!response.ok) {
    addRuntimeLog("warn", "api", `${method} ${path} result`, { status: response.status })
    return { status: "server", code: response.status }
  }
  const data = parse(body)
  return data === null ? { status: "server", code: response.status } : { status: "ok", data }
}

const parseDocumentList = (body: unknown): { documents: RemoteSyncDocument[]; serverTime: string } | null => {
  if (!isObject(body) || !Array.isArray(body.documents) || typeof body.serverTime !== "string") return null
  return { documents: body.documents.map(parseDocument).filter((document): document is RemoteSyncDocument => document !== null), serverTime: body.serverTime }
}

const acknowledge = (): true => true

export const fetchAccountUser = (token: string): Promise<ApiResult<AccountUser>> => request(token, "GET", "/me", parseAccountUser)

export const linkDevice = (token: string, deviceId: string, deviceToken: string): Promise<ApiResult<true>> =>
  request(token, "POST", `/devices/${encodeURIComponent(deviceId)}/link`, acknowledge, { headers: { "X-Device-Token": deviceToken } })

export const fetchSyncDocuments = (token: string, since: string | null) =>
  request(token, "GET", since ? `/sync/changes?since=${encodeURIComponent(since)}` : "/sync", parseDocumentList)

export const putSyncDocument = (token: string, key: ExtensionSyncKey, value: unknown, baseVersion: number) =>
  request(token, "PUT", `/sync/${key}`, (body) => (isObject(body) && typeof body.version === "number" ? { version: body.version } : null), {
    body: { value, baseVersion },
  })

export const deleteSyncDocuments = (token: string): Promise<ApiResult<true>> => request(token, "DELETE", "/sync", acknowledge)

export const revokeExtensionToken = (token: string): Promise<ApiResult<true>> => request(token, "DELETE", "/extension/tokens/current", acknowledge)
