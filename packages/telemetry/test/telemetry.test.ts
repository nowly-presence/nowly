import { afterEach, describe, expect, it, vi } from "vitest";
import { eventSchema, retentionPlan, sendEvent, umamiPayload } from "../src/index";

afterEach(() => vi.unstubAllGlobals());

const id = "22222222-2222-4222-8222-222222222222";

describe("product telemetry privacy contract", () => {
  it("accepts only a named event with its exact properties", () => {
    expect(
      eventSchema.safeParse({
        id,
        name: "extension_download_click",
        source: "web",
        data: { browser: "firefox" }
      }).success
    ).toBe(true);

    for (const data of [
      {
        browser: "firefox",
        token: "secret"
      },
      { browser: "https://private.test" }
    ]) {
      expect(
        eventSchema.safeParse({
          id,
          name: "extension_download_click",
          source: "web",
          data
        }).success
      ).toBe(false);
    }

    expect(
      eventSchema.safeParse({
        id,
        name: "search_performed",
        source: "web",
        data: {}
      }).success
    ).toBe(false);
    expect(
      eventSchema.safeParse({
        id,
        name: "extension_active",
        source: "extension",
        data: {},
        deviceId: "private"
      }).success
    ).toBe(false);
  });

  it("does not forward identity, event id, a real URL or caller metadata", () => {
    const body = umamiPayload(
      eventSchema.parse({
        id,
        name: "presence_used",
        source: "extension",
        data: {
          category: "music",
          origin: "store"
        }
      })
    );
    expect(body).toEqual({
      type: "event",
      payload: {
        website: "b68279a9-5bcc-454a-9147-37fdef5dbebf",
        hostname: "nowly.me",
        url: "/product/extension",
        name: "presence_used",
        data: {
          schema_version: 1,
          source: "extension",
          category: "music",
          origin: "store"
        }
      }
    });
    expect(JSON.stringify(body)).not.toContain(id);
  });

  it("rejects channel mismatches instead of accepting arbitrary attribution", () => {
    for (const [name, source, data] of [
      [
        "site_visit",
        "extension",
        { page: "home" }
      ],
      [
        "extension_active",
        "web",
        {}
      ],
      [
        "retention_return",
        "restore",
        {
          cohort_day: "2026-10-01",
          day: 7
        }
      ],
      [
        "uninstall_page_opened",
        "system",
        {}
      ]
    ])
      expect(eventSchema.safeParse({ id, name, source, data }).success).toBe(false);
  });

  it("uses elapsed 24-hour return windows, not calendar boundaries", () => {
    const startedAt = Date.parse("2026-10-01T23:50:00Z");
    expect(
      retentionPlan(
        {
          startedAt,
          returned: []
        },
        startedAt + 23 * 3600000
      )
    ).toBeNull();
    expect(
      retentionPlan(
        {
          startedAt,
          returned: []
        },
        startedAt + 24 * 3600000
      )
    ).toEqual({
      cohort_day: "2026-10-01",
      day: 1
    });
    expect(
      retentionPlan(
        {
          startedAt,
          returned: [1]
        },
        startedAt + 25 * 3600000
      )
    ).toBeNull();
    expect(
      retentionPlan(
        {
          startedAt,
          returned: []
        },
        startedAt + 48 * 3600000
      )
    ).toBeNull();

    for (const day of [7, 30])
      expect(
        retentionPlan(
          {
            startedAt,
            returned: []
          },
          startedAt + day * 86400000
        )?.day
      ).toBe(day);

    expect(
      retentionPlan(
        {
          startedAt,
          returned: []
        },
        startedAt - 1
      )
    ).toBeNull();
    expect(
      retentionPlan(
        {
          startedAt,
          returned: []
        },
        startedAt + 31 * 86400000
      )
    ).toBeNull();
  });

  it("never sends without consent, including withdrawal before dispatch", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const input = {
      name: "extension_active",
      source: "extension",
      data: {}
    } as const;
    expect(await sendEvent("https://api.test", input, () => false)).toBe(false);
    const consent = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
    expect(await sendEvent("https://api.test", input, consent)).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("sends only a validated envelope without cookies/referrer and fails softly offline", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetcher);
    const input = {
      name: "site_visit",
      source: "web",
      data: { page: "library" }
    } as const;
    expect(await sendEvent("https://api.test/", input, () => true)).toBe(true);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.test/telemetry/events");
    expect(init).toMatchObject({
      credentials: "omit",
      referrerPolicy: "no-referrer"
    });
    expect(JSON.parse(init.body)).toEqual({
      consent: true,
      event: {
        ...input,
        id: expect.any(String)
      }
    });
    expect(await sendEvent("https://api.test", input, () => true)).toBe(false);
  });
});