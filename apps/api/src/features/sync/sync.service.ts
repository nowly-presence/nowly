import { getPrisma } from "@/db/client"
import { jsonByteLength, SYNC_DOCUMENT_MAX_BYTES, type SyncDocumentKey } from "@nowly/shared"
import { syncDocumentSchemas } from "@nowly/shared/schemas"
import { Prisma } from "../../generated/prisma/client"

export type SyncDocumentView = {
  key: string
  value: unknown
  version: number
  updatedAt: string
}

export type SyncValidation =
  | { ok: true; value: Prisma.InputJsonValue }
  | { ok: false; status: 400 | 413; error: "INVALID_SYNC_VALUE" | "SYNC_VALUE_TOO_LARGE" }

export type SyncPutResult =
  | { ok: true; version: number; updatedAt: string }
  | { ok: false; current: SyncDocumentView | null }

const UNIQUE_VIOLATION = "P2002"

const toView = (row: { key: string; value: unknown; version: number; updatedAt: Date }): SyncDocumentView => ({
  key: row.key,
  value: row.value,
  version: row.version,
  updatedAt: row.updatedAt.toISOString(),
})

export const validateSyncValue = (key: SyncDocumentKey, value: unknown): SyncValidation => {
  const parsed = syncDocumentSchemas[key].safeParse(value)
  if (!parsed.success) return { ok: false, status: 400, error: "INVALID_SYNC_VALUE" }
  if (jsonByteLength(parsed.data) > SYNC_DOCUMENT_MAX_BYTES[key]) return { ok: false, status: 413, error: "SYNC_VALUE_TOO_LARGE" }
  return { ok: true, value: parsed.data as Prisma.InputJsonValue }
}

export const listSyncDocuments = async (userId: string, since?: Date): Promise<SyncDocumentView[]> => {
  const rows = await getPrisma().syncDocument.findMany({
    where: { userId, ...(since ? { updatedAt: { gte: since } } : {}) },
    orderBy: { key: "asc" },
  })
  return rows.map(toView)
}

const getSyncDocument = async (userId: string, key: SyncDocumentKey): Promise<SyncDocumentView | null> => {
  const row = await getPrisma().syncDocument.findUnique({ where: { userId_key: { userId, key } } })
  return row ? toView(row) : null
}

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION

export const putSyncDocument = async (input: {
  userId: string
  key: SyncDocumentKey
  value: Prisma.InputJsonValue
  baseVersion: number
  deviceId: string | null
  now?: Date
}): Promise<SyncPutResult> => {
  const prisma = getPrisma()
  const updatedAt = input.now ?? new Date()
  const version = input.baseVersion + 1

  if (input.baseVersion === 0) {
    try {
      await prisma.syncDocument.create({
        data: { userId: input.userId, key: input.key, value: input.value, version, updatedAt, updatedByDeviceId: input.deviceId },
      })
      return { ok: true, version, updatedAt: updatedAt.toISOString() }
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
      return { ok: false, current: await getSyncDocument(input.userId, input.key) }
    }
  }

  const result = await prisma.syncDocument.updateMany({
    where: { userId: input.userId, key: input.key, version: input.baseVersion },
    data: { value: input.value, version, updatedAt, updatedByDeviceId: input.deviceId },
  })
  if (result.count === 1) return { ok: true, version, updatedAt: updatedAt.toISOString() }
  return { ok: false, current: await getSyncDocument(input.userId, input.key) }
}

export const deleteSyncDocuments = async (userId: string): Promise<number> => {
  const result = await getPrisma().syncDocument.deleteMany({ where: { userId } })
  return result.count
}
