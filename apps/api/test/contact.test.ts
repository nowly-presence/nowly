process.env.AWS_ACCESS_KEY_ID = "test-access-key"
process.env.AWS_SECRET_ACCESS_KEY = "test-secret-key"
process.env.AWS_REGION = "eu-west-3"

import Fastify from "fastify"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockSend = vi.hoisted(() => vi.fn().mockResolvedValue({ adapter: "ses", id: "message-id" }))

vi.mock("@opencoredev/email-sdk", () => ({
  createEmailClient: vi.fn(() => ({ send: mockSend })),
}))

vi.mock("@opencoredev/email-sdk/ses", () => ({
  ses: vi.fn(() => ({ name: "ses" })),
}))

const { contactRoutes } = await import("@/features/contact/contact.routes")

describe("contact routes", () => {
  beforeEach(() => {
    mockSend.mockClear()
  })

  it("rejects invalid contact messages", async () => {
    const app = Fastify()
    await app.register(contactRoutes, { prefix: "/contact" })

    const response = await app.inject({
      method: "POST",
      url: "/contact",
      payload: { email: "not-an-email", subject: "Help", message: "This is a message." },
    })

    expect(response.statusCode).toBe(400)
    expect(mockSend).not.toHaveBeenCalled()
    await app.close()
  })

  it("sends a valid contact message to the support inbox", async () => {
    const app = Fastify()
    await app.register(contactRoutes, { prefix: "/contact" })

    const response = await app.inject({
      method: "POST",
      url: "/contact",
      payload: {
        name: "Ada",
        email: "ada@example.com",
        subject: "A question",
        message: "I have a question about the extension.",
      },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ ok: true })
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      from: "Nowly Contact <hello@nowly.me>",
      to: "hello@nowly.me",
      replyTo: "ada@example.com",
      subject: "[Nowly Contact] A question",
    }))
    await app.close()
  })

  it("accepts honeypot submissions without sending email", async () => {
    const app = Fastify()
    await app.register(contactRoutes, { prefix: "/contact" })

    const response = await app.inject({
      method: "POST",
      url: "/contact",
      payload: {
        email: "bot@example.com",
        subject: "Spam",
        message: "This is a message.",
        website: "https://spam.example",
      },
    })

    expect(response.statusCode).toBe(200)
    expect(mockSend).not.toHaveBeenCalled()
    await app.close()
  })
})
