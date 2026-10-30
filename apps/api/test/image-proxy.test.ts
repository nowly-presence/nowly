import { createCacheId, fetchImage, parseProxyUrl } from "@/features/image-proxy/image-proxy.service";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const mockPresenceRepo = vi.hoisted(() => ({ getAllPresenceMetas: vi.fn() }));

vi.mock("@/features/presence/presence.repository", () => mockPresenceRepo);
vi.mock("@/db/client", () => ({
  getPrisma: vi.fn(() => ({})),
  hasDatabase: vi.fn(() => true)
}));

describe("parseProxyUrl", () => {
  beforeEach(() => {
    mockPresenceRepo.getAllPresenceMetas.mockResolvedValue([
      {
        slug: "tiktok",
        metadata: {
          imageProxy: {
            hostSuffixes: ["tiktokcdn.com"]
          }
        }
      },
      {
        slug: "canalplus",
        metadata: {
          imageProxy: {
            hostSuffixes: ["thumb.canalplus.pro"]
          }
        }
      }
    ]);
  });

  it("matches a known service by host suffix", async () => {
    const result = await parseProxyUrl("https://p16.tiktokcdn.com/foo.jpg");
    expect(result?.service.id).toBe("tiktok");
  });

  it("rejects a host that matches no known presence's declared imageProxy config", async () => {
    expect(await parseProxyUrl("https://example.com/foo.jpg")).toBeNull();
  });

  it("uses an explicit serviceId only for that service's own hosts", async () => {
    expect((await parseProxyUrl("https://thumb.canalplus.pro/foo.jpg", "canalplus"))?.service.id).toBe("canalplus");
    expect(await parseProxyUrl("https://example.com/foo.jpg", "canalplus")).toBeNull();
    expect(await parseProxyUrl("https://p16.tiktokcdn.com/foo.jpg", "canalplus")).toBeNull();
    expect(await parseProxyUrl("https://169.254.169.254/latest/meta-data/", "tiktok")).toBeNull();
  });

  it.each(["https://eviltiktokcdn.com/foo.jpg", "https://p16.tiktokcdn.com.evil.net/foo.jpg", "https://canalplus.pro/foo.jpg"])(
    "matches host suffixes only on a label boundary: %s",
    async (url) => {
      expect(await parseProxyUrl(url)).toBeNull();
    }
  );

  it("accepts the bare suffix host", async () => {
    expect((await parseProxyUrl("https://tiktokcdn.com/foo.jpg"))?.service.id).toBe("tiktok");
  });

  it.each(["http://p16.tiktokcdn.com/foo.jpg", "ftp://p16.tiktokcdn.com/foo.jpg"])("rejects non-HTTPS URLs: %s", async (url) => {
    expect(await parseProxyUrl(url)).toBeNull();
  });

  it("rejects an invalid URL", async () => {
    expect(await parseProxyUrl("not-a-url")).toBeNull();
  });

  it("rejects an empty/undefined URL", async () => {
    expect(await parseProxyUrl(undefined)).toBeNull();
    expect(await parseProxyUrl("  ")).toBeNull();
  });

  it("rejects an unknown serviceId", async () => {
    expect(await parseProxyUrl("https://example.com/foo.jpg", "some-new-presence")).toBeNull();
  });
});

describe("createCacheId", () => {
  it("is deterministic for the same input", () => {
    expect(createCacheId("generic", "https://a.com/x.png")).toBe(createCacheId("generic", "https://a.com/x.png"));
  });

  it("differs for different services or urls", () => {
    expect(createCacheId("generic", "https://a.com/x.png")).not.toBe(createCacheId("twitch", "https://a.com/x.png"));
  });
});

describe("fetchImage", () => {
  const originalFetch = global.fetch;
  const service = {
    id: "generic",
    hostSuffixes: ["example.com"]
  };
  const redirectTo = (location?: string) =>
    new Response(null, {
      status: 302,
      headers: location ? { Location: location } : {}
    });
  const png = () =>
    new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "Content-Type": "image/png" }
    });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns the image on a successful fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue(png()) as unknown as typeof fetch;

    const result = await fetchImage(new URL("https://example.com/x.png"), service);
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.contentType).toBe("image/png");
      expect(result.buffer.byteLength).toBe(3);
    }
  });

  it("propagates the upstream status on a non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers()
    }) as unknown as typeof fetch;

    const result = await fetchImage(new URL("https://example.com/x.png"), service);
    expect(result).toEqual({
      ok: false,
      status: 404,
      error: "IMAGE_UPSTREAM_ERROR"
    });
  });

  it("rejects an empty response body", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array(0), { status: 200 })) as unknown as typeof fetch;

    const result = await fetchImage(new URL("https://example.com/x.png"), service);
    expect(result).toEqual({
      ok: false,
      status: 502,
      error: "EMPTY_IMAGE"
    });
  });

  it("refuses a URL outside the service hosts without fetching it", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(await fetchImage(new URL("https://169.254.169.254/latest/meta-data/"), service)).toEqual({
      ok: false,
      status: 400,
      error: "INVALID_IMAGE_URL"
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("follows redirects that stay on the service hosts", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(redirectTo("/moved.png"))
      .mockResolvedValueOnce(redirectTo("https://cdn.example.com/y.png"))
      .mockResolvedValueOnce(png());
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await fetchImage(new URL("https://example.com/x.png"), service);

    expect(result).toMatchObject({
      ok: true,
      contentType: "image/png"
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["https://example.com/x.png", "https://example.com/moved.png", "https://cdn.example.com/y.png"]);
    expect(fetchMock.mock.calls.every(([, init]) => init.redirect === "manual")).toBe(true);
  });

  it.each([
    ["an internal address", "https://169.254.169.254/latest/meta-data/"],
    ["plain HTTP on an allowed host", "http://cdn.example.com/y.png"],
    ["a look-alike host", "https://evilexample.com/x.png"],
    ["a non-http scheme", "file:///etc/passwd"],
    ["no location", undefined]
  ])("refuses a redirect to %s", async (_case, location) => {
    const fetchMock = vi.fn().mockResolvedValueOnce(redirectTo(location)).mockResolvedValue(png());
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(await fetchImage(new URL("https://example.com/x.png"), service)).toEqual({
      ok: false,
      status: 502,
      error: "IMAGE_REDIRECT_REJECTED"
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("gives up after three redirects", async () => {
    const fetchMock = vi.fn(async () => redirectTo("https://example.com/loop.png"));
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(await fetchImage(new URL("https://example.com/x.png"), service)).toEqual({
      ok: false,
      status: 502,
      error: "IMAGE_REDIRECT_REJECTED"
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("refuses a declared size above 5 MB without reading the body", async () => {
    const body = new ReadableStream<Uint8Array>({
      pull: () => {
        throw new Error("the body must not be read");
      }
    });
    global.fetch = vi.fn().mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Length": String(MAX_IMAGE_BYTES + 1)
        }
      })
    ) as unknown as typeof fetch;

    expect(await fetchImage(new URL("https://example.com/x.png"), service)).toEqual({
      ok: false,
      status: 413,
      error: "IMAGE_TOO_LARGE"
    });
  });

  it("stops reading an undeclared body as soon as it exceeds 5 MB", async () => {
    const chunk = new Uint8Array(1024 * 1024);
    let pulled = 0;
    const body = new ReadableStream<Uint8Array>({
      pull: (controller) => {
        pulled += 1;
        controller.enqueue(chunk);
      }
    });
    global.fetch = vi.fn().mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: { "Content-Type": "image/png" }
      })
    ) as unknown as typeof fetch;

    expect(await fetchImage(new URL("https://example.com/x.png"), service)).toEqual({
      ok: false,
      status: 413,
      error: "IMAGE_TOO_LARGE"
    });
    expect(pulled).toBeLessThanOrEqual(MAX_IMAGE_BYTES / chunk.byteLength + 2);
  });

  it("accepts an image of exactly 5 MB", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array(MAX_IMAGE_BYTES), {
        status: 200,
        headers: { "Content-Type": "image/png" }
      })
    ) as unknown as typeof fetch;

    const result = await fetchImage(new URL("https://example.com/x.png"), service);

    expect(result).toMatchObject({
      ok: true,
      contentType: "image/png"
    });
    expect(result.ok && result.buffer.byteLength).toBe(MAX_IMAGE_BYTES);
  });
});