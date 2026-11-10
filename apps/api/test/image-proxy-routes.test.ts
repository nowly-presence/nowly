import { imageProxyRoutes } from "@/features/image-proxy/image-proxy.routes";
import { inject, mount } from "./http";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createImageProxyCatalog } from "./image-proxy.fixture";

describe("image proxy routes", () => {
  let app: ReturnType<typeof mount>;
  let database: Awaited<ReturnType<typeof createImageProxyCatalog>>;
  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    database = await createImageProxyCatalog();
  });

  beforeEach(() => {
    app = mount("/", imageProxyRoutes);
  });

  afterAll(() => database.close());

  afterEach(async () => {
    globalThis.fetch = originalFetch;
  });

  it("GET /image-proxy handles supported CDN images and rejects invalid URLs", async () => {
    const invalidRes = await inject(app, {
      method: "GET",
      url: `/image-proxy?url=${encodeURIComponent("https://example.com/image.jpg")}`
    });
    expect(invalidRes.statusCode).toBe(400);
    expect(JSON.parse(invalidRes.body)).toEqual({ error: "INVALID_IMAGE_URL" });

    const unencodedRes = await inject(app, {
      method: "GET",
      url: "/image-proxy?service=tiktok&url=https://p16-common-sign.tiktokcdn-eu.com/image.jpg?dr=1&x-signature=abc"
    });
    expect(unencodedRes.statusCode).toBe(400);
    expect(JSON.parse(unencodedRes.body)).toEqual({ error: "IMAGE_URL_NOT_ENCODED" });

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          "content-type": "image/jpeg",
          "content-length": "3"
        }
      })
    );

    const validRes = await inject(app, {
      method: "GET",
      url: `/image-proxy?url=${encodeURIComponent("https://p16-common-sign.tiktokcdn-eu.com/image.jpg")}`
    });
    expect(validRes.statusCode).toBe(200);
    expect(validRes.headers["content-type"]).toBe("image/jpeg");
    expect(Buffer.from(validRes.rawPayload)).toEqual(Buffer.from([1, 2, 3]));
  });

  it("GET /i returns fetched supported CDN images with a short URL", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([16, 17, 18]), {
        status: 200,
        headers: {
          "content-type": "image/jpeg",
          "content-length": "3"
        }
      })
    );

    const res = await inject(app, {
      method: "GET",
      url: `/i?u=${encodeURIComponent("https://p16-common-sign.tiktokcdn-eu.com/image.jpg?x=1&y=2")}`
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
    expect(Buffer.from(res.rawPayload)).toEqual(Buffer.from([16, 17, 18]));
    const fetchMock = vi.mocked(globalThis.fetch);
    expect(fetchMock.mock.calls[0][0]).toBe("https://p16-common-sign.tiktokcdn-eu.com/image.jpg?x=1&y=2");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: { Referer: "https://www.tiktok.com/" }
    });
  });

  it("POST /images-proxy caches fetched images and returns a short public URL, reusing on duplicate requests", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([21, 22, 23]), {
        status: 200,
        headers: {
          "content-type": "image/png",
          "content-length": "3"
        }
      })
    );

    const res = await inject(app, {
      method: "POST",
      url: "/images-proxy",
      payload: {
        service: "tiktok",
        url: "https://p16-common-sign.tiktokcdn-eu.com/image.png?x=1&y=2"
      }
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("*");

    const body = JSON.parse(res.body) as {
      url: string;
      expiresIn: number;
    };
    expect(body.url).toMatch(/^http:\/\/localhost(?::\d+)?\/images-proxy\/[a-zA-Z0-9_-]{32}$/);
    expect(body.expiresIn).toBe(300);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    globalThis.fetch = vi.fn();
    const res2 = await inject(app, {
      method: "POST",
      url: "/images-proxy",
      payload: {
        service: "tiktok",
        url: "https://p16-common-sign.tiktokcdn-eu.com/image.png?x=1&y=2"
      }
    });

    expect(res2.statusCode).toBe(200);
    expect(JSON.parse(res2.body).url).toBe(body.url);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("GET /images-proxy/:id returns a cached image", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([31, 32, 33]), {
        status: 200,
        headers: {
          "content-type": "image/webp",
          "content-length": "3"
        }
      })
    );

    const postRes = await inject(app, {
      method: "POST",
      url: "/images-proxy",
      payload: {
        service: "tiktok",
        url: "https://p16-common-sign.tiktokcdn-eu.com/cached-image.webp"
      }
    });

    const { url: imageUrl } = JSON.parse(postRes.body) as {
      url: string;
    };
    const id = imageUrl.split("/").pop()!;

    const res = await inject(app, {
      method: "GET",
      url: `/images-proxy/${id}`
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/webp");
    expect(Buffer.from(res.rawPayload)).toEqual(Buffer.from([31, 32, 33]));
  });

  it("GET /images-proxy/:id returns 404 when the cached image does not exist", async () => {
    const res = await inject(app, {
      method: "GET",
      url: "/images-proxy/nonexistent_id_1234567890abc"
    });

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body)).toEqual({ error: "IMAGE_NOT_FOUND" });
  });

  it("GET /image-proxy supports explicit service matching and rejects mismatches", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([4, 5, 6]), {
        status: 200,
        headers: {
          "content-type": "image/webp",
          "content-length": "3"
        }
      })
    );

    const validRes = await inject(app, {
      method: "GET",
      url: `/image-proxy?service=tiktok&url=${encodeURIComponent("https://p16-common-sign.tiktokcdn-eu.com/image.webp")}`
    });

    expect(validRes.statusCode).toBe(200);
    expect(validRes.headers["content-type"]).toBe("image/webp");
    expect(Buffer.from(validRes.rawPayload)).toEqual(Buffer.from([4, 5, 6]));

    const mismatchRes = await inject(app, {
      method: "GET",
      url: `/image-proxy?service=unknown&url=${encodeURIComponent("https://p16-common-sign.tiktokcdn-eu.com/image.jpg")}`
    });

    expect(mismatchRes.statusCode).toBe(400);
    expect(JSON.parse(mismatchRes.body)).toEqual({ error: "INVALID_IMAGE_URL" });
  });

  it.each([
    [
      "GET /image-proxy",
      {
        method: "GET" as const,
        url: `/image-proxy?service=tiktok&url=${encodeURIComponent("https://169.254.169.254/latest/meta-data/")}`
      }
    ],
    [
      "POST /images-proxy",
      {
        method: "POST" as const,
        url: "/images-proxy",
        payload: {
          service: "github",
          url: "https://example.com/avatar.png"
        }
      }
    ]
  ])("%s refuses a URL outside the requested service's hosts without fetching it", async (_route, request) => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const res = await inject(app, request);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({ error: "INVALID_IMAGE_URL" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});