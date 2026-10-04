import { afterEach, describe, expect, it, vi } from "vitest";

import { getDiscordCommunity, MIN_DISPLAYED_MEMBERS, parseDiscordCommunity } from "./discord";

describe("parseDiscordCommunity", () => {
  it("keeps the counts when the community is large enough to be social proof", () => {
    expect(parseDiscordCommunity({
      approximate_member_count: MIN_DISPLAYED_MEMBERS + 1,
      approximate_presence_count: 42,
    })).toEqual({ members: MIN_DISPLAYED_MEMBERS + 1, online: 42 });
  });

  it("hides a member count below the display threshold", () => {
    expect(parseDiscordCommunity({
      approximate_member_count: MIN_DISPLAYED_MEMBERS - 1,
      approximate_presence_count: 0,
    })).toEqual({ members: null, online: null });
  });

  it.each([null, undefined, "nope", 12, [], { approximate_member_count: "900" }])(
    "ignores malformed payload %j",
    (payload) => {
      expect(parseDiscordCommunity(payload)).toEqual({ members: null, online: null });
    },
  );
});

describe("getDiscordCommunity", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back to no counts when Discord answers with an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 })));

    await expect(getDiscordCommunity()).resolves.toEqual({ members: null, online: null });
  });

  it("falls back to no counts when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(getDiscordCommunity()).resolves.toEqual({ members: null, online: null });
  });
});
