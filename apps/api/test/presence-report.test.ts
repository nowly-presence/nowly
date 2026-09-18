import { presenceDisplayName, sanitizeReportMessage, submitPresenceReport } from "@/features/presence/presence-report"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@nowly/env/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@nowly/env/server")>()
  return {
    ...actual,
    serverEnv: {
      ...actual.serverEnv,
      FRONTEND_URL: "https://nowly.me",
      DISCORD_WEBHOOK_REPORT_URL: "https://discord.com/api/webhooks/test/token",
    },
  }
})

describe("presence reports", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("sanitizes control characters from the message", () => {
    expect(sanitizeReportMessage("  Hello\u0007 world  ")).toBe("Hello world")
  })

  it("resolves a localized presence name", () => {
    expect(presenceDisplayName({ name: { "fr-FR": "YouTube FR", "en-US": "YouTube" } }, "youtube", "fr-FR")).toBe("YouTube FR")
    expect(presenceDisplayName({ name: "YouTube" }, "youtube")).toBe("YouTube")
    expect(presenceDisplayName(null, "youtube")).toBe("youtube")
  })

  it("posts a Discord embed with presence details", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await submitPresenceReport({
      slug: "youtube",
      name: "YouTube",
      message: "Idle on /watch",
      locale: "fr-FR",
    })

    expect(result).toBe("sent")
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://discord.com/api/webhooks/test/token")
    const body = JSON.parse(String(init.body))
    expect(body.embeds[0].title).toBe("Presence issue report")
    expect(body.embeds[0].fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Presence", value: "[YouTube](https://nowly.me/library/youtube)" }),
        expect.objectContaining({ name: "Slug", value: "`youtube`" }),
        expect.objectContaining({ name: "Problem", value: "Idle on /watch" }),
        expect.objectContaining({ name: "Locale", value: "fr-FR" }),
      ]),
    )
  })
})
