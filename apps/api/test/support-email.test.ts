import { beforeEach, describe, expect, it, vi } from "vitest"

const sendMock = vi.hoisted(() => vi.fn())
const createEmailClientMock = vi.hoisted(() => vi.fn(() => ({ send: sendMock })))
const sesMock = vi.hoisted(() => vi.fn(() => ({ name: "ses", send: vi.fn() })))
const renderMock = vi.hoisted(() => vi.fn(async (_email, options?: { plainText?: boolean }) =>
  options?.plainText ? "plain text body" : "<html>html body</html>",
))

vi.mock("@opencoredev/email-sdk", () => ({
  createEmailClient: createEmailClientMock,
}))

vi.mock("@opencoredev/email-sdk/ses", () => ({
  ses: sesMock,
}))

vi.mock("@react-email/render", () => ({
  render: renderMock,
}))

describe("supporter pass email", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllEnvs()

    vi.stubEnv("AWS_ACCESS_KEY_ID", "aws-key")
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "aws-secret")
    vi.stubEnv("AWS_REGION", "us-east-1")

    vi.stubEnv("SUPPORT_REDEEM_URL", "https://nowly.me/support/redeem")

    createEmailClientMock.mockReturnValue({ send: sendMock })
    sesMock.mockReturnValue({ name: "ses", send: vi.fn() })
    sendMock.mockResolvedValue({ provider: "ses", messageId: "ses-message-1" })
  })

  it("sends supporter pass emails through Email SDK SES", async () => {
    const { sendSupporterPassEmail } = await import("@/features/support/support-email")

    const result = await sendSupporterPassEmail({
      to: "donator@example.com",
      donorName: "Anthony",
      code: "NOWLY-AAAA-BBBB-CCCC",
      provider: "kofi",
      amount: "5.00",
      currency: "EUR",
    })

    expect(result).toEqual({ sent: true, id: "ses-message-1" })
    expect(sesMock).toHaveBeenCalledWith({
      accessKeyId: "aws-key",
      secretAccessKey: "aws-secret",
      region: "us-east-1",

    })
    expect(createEmailClientMock).toHaveBeenCalledWith(expect.objectContaining({
      defaultAdapter: "ses",
      retry: { retries: 1 },
    }))
    expect(renderMock).toHaveBeenCalledTimes(2)
    expect(sendMock).toHaveBeenCalledWith({
      from: "Nowly <no-reply@nowly.me>",
      to: "donator@example.com",
      replyTo: "contact@nowly.me",
      subject: "Your Nowly supporter pass key",
      html: "<html>html body</html>",
      text: "plain text body",
      headers: {
        "X-Nowly-Email": "supporter-pass",
      },
      tags: [
        { name: "type", value: "supporter-pass" },
        { name: "provider", value: "kofi" },
      ],
    }, {
      idempotencyKey: "supporter-pass:kofi:NOWLY-AAAA-BBBB-CCCC",
    })
  })
})
