import { supportRoutes } from "@/features/support/support.routes"
import Fastify from "fastify"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockSupportRepo = vi.hoisted(() => ({
  createSupporterPass: vi.fn(),
  hasAdFreeAccess: vi.fn(),
  recordDonationAndCreatePass: vi.fn(),
  redeemSupporterCodeForDevice: vi.fn(),
}))
const mockSupportEmail = vi.hoisted(() => ({
  sendSupporterPassEmail: vi.fn(),
}))

vi.mock("@/features/support/support.repository", () => mockSupportRepo)
vi.mock("@/features/support/support-email", () => mockSupportEmail)

async function buildApp() {
  const app = Fastify()
  await app.register(supportRoutes)
  return app
}

describe("Support routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupportEmail.sendSupporterPassEmail.mockResolvedValue({ sent: true, id: "email-1" })
    delete process.env.KOFI_WEBHOOK_TOKEN
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
    delete process.env.KOFI_WEBHOOK_TOKEN
  })

  it("GET /ads/status defaults to ads enabled without a deviceId", async () => {
    const res = await app.inject({ method: "GET", url: "/ads/status" })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ hasAds: true, adFree: false })
    expect(mockSupportRepo.hasAdFreeAccess).not.toHaveBeenCalled()
  })

  it("GET /ads/status returns ad-free status for a supporter device", async () => {
    mockSupportRepo.hasAdFreeAccess.mockResolvedValue(true)

    const res = await app.inject({ method: "GET", url: "/ads/status?deviceId=device-1" })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ hasAds: false, adFree: true })
    expect(mockSupportRepo.hasAdFreeAccess).toHaveBeenCalledWith("device-1")
  })

  it("POST /redeem links a valid code to a device", async () => {
    mockSupportRepo.redeemSupporterCodeForDevice.mockResolvedValue({
      ok: true,
      adFree: true,
      deviceCount: 1,
      maxDevices: 5,
    })

    const res = await app.inject({
      method: "POST",
      url: "/redeem",
      payload: { code: "NOWLY-AAAA-BBBB-CCCC", deviceId: "device-1" },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({
      ok: true,
      adFree: true,
      hasAds: false,
      deviceCount: 1,
      maxDevices: 5,
    })
  })

  it("POST /redeem returns 409 when the device limit is reached", async () => {
    mockSupportRepo.redeemSupporterCodeForDevice.mockResolvedValue({
      ok: false,
      error: "device_limit_reached",
      maxDevices: 5,
    })

    const res = await app.inject({
      method: "POST",
      url: "/redeem",
      payload: { code: "NOWLY-AAAA-BBBB-CCCC", deviceId: "device-6" },
    })

    expect(res.statusCode).toBe(409)
    expect(JSON.parse(res.body)).toEqual({
      ok: false,
      error: "device_limit_reached",
      maxDevices: 5,
    })
  })

  it("POST /webhooks/kofi records a donation and returns the generated code", async () => {
    mockSupportRepo.recordDonationAndCreatePass.mockResolvedValue({
      created: true,
      code: "NOWLY-AAAA-BBBB-CCCC",
      passId: "pass-1",
    })

    const res = await app.inject({
      method: "POST",
      url: "/webhooks/kofi",
      payload: {
        message_id: "kofi-event-1",
        amount: "5",
        currency: "eur",
        email: "supporter@example.com",
      },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({
      ok: true,
      created: true,
      code: "NOWLY-AAAA-BBBB-CCCC",
      passId: "pass-1",
    })
    expect(mockSupportRepo.recordDonationAndCreatePass).toHaveBeenCalledWith(expect.objectContaining({
      provider: "kofi",
      providerEventId: "kofi-event-1",
      amount: "5",
      currency: "eur",
      donorEmail: "supporter@example.com",
    }))
    expect(mockSupportEmail.sendSupporterPassEmail).toHaveBeenCalledWith({
      to: "supporter@example.com",
      donorName: undefined,
      code: "NOWLY-AAAA-BBBB-CCCC",
      provider: "kofi",
      amount: "5",
      currency: "eur",
    })
  })

  it("POST /webhooks/kofi accepts Ko-fi form encoded payloads", async () => {
    mockSupportRepo.recordDonationAndCreatePass.mockResolvedValue({
      created: true,
      code: "NOWLY-AAAA-BBBB-CCCC",
      passId: "pass-1",
    })

    const data = JSON.stringify({
      message_id: "kofi-event-2",
      amount: "10",
      currency: "EUR",
      email: "supporter@example.com",
      verification_token: "token-1",
    })

    const res = await app.inject({
      method: "POST",
      url: "/webhooks/kofi",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      payload: new URLSearchParams({ data }).toString(),
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({
      ok: true,
      created: true,
      code: "NOWLY-AAAA-BBBB-CCCC",
      passId: "pass-1",
    })
    expect(mockSupportRepo.recordDonationAndCreatePass).toHaveBeenCalledWith(expect.objectContaining({
      provider: "kofi",
      providerEventId: "kofi-event-2",
      amount: "10",
      currency: "EUR",
      donorEmail: "supporter@example.com",
    }))
    expect(mockSupportEmail.sendSupporterPassEmail).toHaveBeenCalledWith({
      to: "supporter@example.com",
      donorName: undefined,
      code: "NOWLY-AAAA-BBBB-CCCC",
      provider: "kofi",
      amount: "10",
      currency: "EUR",
    })
  })
})
