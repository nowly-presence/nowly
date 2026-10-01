import { serverEnv } from "@nowly/env/server"
import { canonicalJson } from "@nowly/shared"
import { createHash, createPrivateKey, sign } from "crypto"

export { canonicalJson }

export const sha256Base64Url = (input: string): string =>
  createHash("sha256").update(input, "utf8").digest("base64url")

export const signedPayload = (input: {
  slug: string
  version: string
  sha256: string
  metadataHash: string
  iframeSha256?: string
  signedAt: string
}): string => canonicalJson(input)

export const signPresenceRelease = (payload: string): string => {
  let privateKey: string
  try {
    privateKey = serverEnv.PRESENCE_SIGNING_PRIVATE_KEY
  } catch {
    throw new Error("PRESENCE_SIGNING_PRIVATE_KEY is missing")
  }

  if (!privateKey) {
    throw new Error("PRESENCE_SIGNING_PRIVATE_KEY is missing")
  }

  return sign("sha256", Buffer.from(payload), {
    key: createPrivateKey({
      key: Buffer.from(privateKey, "base64url"),
      format: "der",
      type: "pkcs8",
    }),
    dsaEncoding: "ieee-p1363",
  }).toString("base64url")
}