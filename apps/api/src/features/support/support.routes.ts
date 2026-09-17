import { requireAuth } from "@/features/auth/auth.middleware"
import { serverEnv } from "@nowly/env/server"
import {
  adsStatusQuerySchema,
  createPassBodySchema,
  redeemBodySchema,
  redeemQuerySchema,
} from "@nowly/shared/schemas"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { createHmac, timingSafeEqual } from "node:crypto"
import { URLSearchParams } from "node:url"
import { Readable } from "node:stream"
import {
  createSupporterPass,
  hasAdFreeAccess,
  recordDonationAndCreatePass,
  redeemSupporterCodeForDevice,
  verifySupporterCode,
} from "./support.repository"
import { sendSupporterPassEmail } from "./support-email"

const DISCORD_WEBHOOK_SUCCESS = serverEnv.DISCORD_WEBHOOK_SUCCESS_URL
const DISCORD_WEBHOOK_FAILURE = serverEnv.DISCORD_WEBHOOK_FAILURE_URL

const sendDiscordEmbed = async (url: string | undefined, embed: {
  color?: number
  description?: string
  fields?: { name: string; value: string; inline?: boolean }[]
}): Promise<void> => {
  if (!url) return
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch {
    // silent
  }
}

const providerLabel = (provider: string): string =>
  provider === "github" ? "GitHub Sponsors" : provider === "kofi" ? "Ko-fi" : provider

type RawBodyRequest = FastifyRequest & {
  rawBody?: string
}

const rawBodyHook = async (request: FastifyRequest, _reply: FastifyReply, payload: Readable): Promise<Readable> => {
  const chunks: Buffer[] = []
  for await (const chunk of payload) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const rawBody = Buffer.concat(chunks).toString("utf8")
  ;(request as RawBodyRequest).rawBody = rawBody
  const stream = Readable.from(rawBody ? [rawBody] : [])
  ;(stream as Readable & { receivedEncodedLength?: number }).receivedEncodedLength = Buffer.byteLength(rawBody)
  return stream
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined

const verifyGithubSignature = (rawBody: string | undefined, signature: string | string[] | undefined): boolean => {
  const secret = serverEnv.GITHUB_SPONSORS_WEBHOOK_SECRET
  if (!secret) return true
  if (!rawBody || typeof signature !== "string" || !signature.startsWith("sha256=")) return false

  const expected = Buffer.from(
    `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`,
  )
  const provided = Buffer.from(signature)
  return expected.length === provided.length && timingSafeEqual(expected, provided)
}

const parseKofiPayload = (body: unknown): Record<string, unknown> => {
  const record = asRecord(body)
  const data = record.data
  if (typeof data !== "string") return record

  try {
    return asRecord(JSON.parse(data))
  } catch {
    return record
  }
}

const sendSupporterEmailIfPossible = async (
  request: FastifyRequest,
  input: {
    code?: string
    created: boolean
    provider: "kofi" | "github" | "manual"
    donorEmail?: string
    donorName?: string
    amount?: string
    currency?: string
  },
): Promise<void> => {
  if (!input.created || !input.code) return

  const result = await sendSupporterPassEmail({
    to: input.donorEmail,
    donorName: input.donorName,
    code: input.code,
    provider: input.provider,
    amount: input.amount,
    currency: input.currency,
  })

    if (!result.sent) {
    request.log.warn({ error: result.error, reason: result.reason, provider: input.provider }, "Failed to send supporter pass email")
    await sendDiscordEmbed(
      DISCORD_WEBHOOK_FAILURE,
      {
        color: 0x2F57F9,
        description: "Supporter pass created but email not sent",
        fields: [
          { name: "Provider", value: providerLabel(input.provider), inline: true },
          { name: "Donor", value: input.donorName || "unknown", inline: true },
          { name: "Code", value: `\`${input.code}\``, inline: true },
          { name: "Reason", value: `\`${result.error || result.reason}\``, inline: true },
        ],
      },
    )
  }
}

export const supportRoutes = async (fastify: FastifyInstance) => {
  fastify.addContentTypeParser("application/x-www-form-urlencoded", { parseAs: "string" }, (_request, body, done) => {
    const rawBody = typeof body === "string" ? body : body.toString("utf8")
    const form = new URLSearchParams(rawBody)
    const parsed: Record<string, string | string[]> = {}

    for (const [key, value] of form.entries()) {
      const current = parsed[key]
      if (Array.isArray(current)) {
        current.push(value)
      } else if (typeof current === "string") {
        parsed[key] = [current, value]
      } else {
        parsed[key] = value
      }
    }

    done(null, parsed)
  })

  fastify.addHook("preParsing", rawBodyHook)

  fastify.get("/redeem", async (request, reply) => {
    const parsed = redeemQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ valid: false, error: "missing_code" })
    }
    const result = await verifySupporterCode(parsed.data.code)
    if (!result.valid) return reply.send({ valid: false })
    return reply.send({ valid: true, maxDevices: result.maxDevices })
  })

  fastify.get("/ads/status", async (request, reply) => {
    const parsed = adsStatusQuerySchema.safeParse(request.query)
    if (!parsed.success || !parsed.data.deviceId) {
      return reply.header("Cache-Control", "no-store").send({ hasAds: true, adFree: false })
    }

    const adFree = await hasAdFreeAccess(parsed.data.deviceId)
    return reply.header("Cache-Control", "no-store").send({ hasAds: !adFree, adFree })
  })

  fastify.post("/redeem", async (request, reply) => {
    const parsed = redeemBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ ok: false, error: "invalid_request" })

    const result = await redeemSupporterCodeForDevice(parsed.data.code, parsed.data.deviceId)
    if (!result.ok) {
      const status = result.error === "device_limit_reached" ? 409 : 400
      return reply.status(status).send(result)
    }

    return { ...result, hasAds: false }
  })

  fastify.post("/passes", async (request, reply) => {
    await requireAuth(request, reply)
    if (reply.sent) return

    const parsed = createPassBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) return reply.status(400).send({ error: "Invalid request body" })

    const pass = await createSupporterPass(parsed.data)
    return {
      ok: true,
      code: pass.code,
      maxDevices: pass.maxDevices,
    }
  })

  fastify.post("/webhooks/kofi", async (request, reply) => {
    const payload = parseKofiPayload(request.body)
    const expectedToken = serverEnv.KOFI_WEBHOOK_TOKEN
    if (expectedToken && asString(payload.verification_token) !== expectedToken) {
      return reply.status(401).send({ error: "Invalid Ko-fi webhook token" })
    }

    const providerEventId =
      asString(payload.message_id) ??
      asString(payload.kofi_transaction_id) ??
      asString(payload.id)

    if (!providerEventId) return reply.status(400).send({ error: "Missing Ko-fi event id" })

    const donorEmail = asString(payload.email)
    const donorName = asString(payload.from_name)
    const amount = asString(payload.amount)
    const currency = asString(payload.currency)

    const result = await recordDonationAndCreatePass({
      provider: "kofi",
      providerEventId,
      amount,
      currency,
      donorEmail,
      donorName,
      payload,
    })
    await sendSupporterEmailIfPossible(request, {
      ...result,
      provider: "kofi",
      donorEmail,
      donorName,
      amount,
      currency,
    })

    if (result.created) {
      await sendDiscordEmbed(
        DISCORD_WEBHOOK_SUCCESS,
        {
          color: 0x2F57F9,
          description: `Thank you **${donorName || "someone"}** for donating on Ko-fi!${amount ? ` (${amount} ${currency})` : ""}`,
        },
      )
    }

    return { ok: true, ...result }
  })

  fastify.post("/webhooks/github-sponsors", async (request, reply) => {
    if (!verifyGithubSignature((request as RawBodyRequest).rawBody, request.headers["x-hub-signature-256"])) {
      return reply.status(401).send({ error: "Invalid GitHub webhook signature" })
    }

    const payload = asRecord(request.body)
    const sponsorship = asRecord(payload.sponsorship)
    const sponsor = asRecord(sponsorship.sponsor)
    const tier = asRecord(sponsorship.tier)
    const sponsorEmail = asString(sponsor.email)
    const sponsorLogin = asString(sponsor.login)
    const amount = String(tier.monthly_price_in_cents ?? "")
    const providerEventId =
      asString(payload.delivery) ??
      asString(request.headers["x-github-delivery"]) ??
      asString(sponsorship.node_id) ??
      asString(sponsorship.id)

    if (!providerEventId) return reply.status(400).send({ error: "Missing GitHub Sponsors event id" })

    const result = await recordDonationAndCreatePass({
      provider: "github",
      providerEventId,
      amount,
      currency: "USD",
      donorEmail: sponsorEmail,
      donorLogin: sponsorLogin,
      payload: {
        action: asString(payload.action),
        id: asString(sponsorship.id),
        tier: asString(tier.name),
        github_login: sponsorLogin,
      },
    })
    await sendSupporterEmailIfPossible(request, {
      ...result,
      provider: "github",
      donorEmail: sponsorEmail,
      donorName: sponsorLogin,
      amount,
      currency: "USD",
    })

    if (result.created) {
      await sendDiscordEmbed(
        DISCORD_WEBHOOK_SUCCESS,
        {
          color: 0x2F57F9,
          description: `Thank you **${sponsorLogin || "someone"}** for sponsoring on GitHub Sponsors!`,
        },
      )
    }

    return { ok: true, ...result }
  })
}

export const register = async (app: FastifyInstance): Promise<void> => {
  await app.register(supportRoutes)
}
