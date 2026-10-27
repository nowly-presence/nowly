import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCustomActivityPublication } from "@/features/custom-activity/custom-activity-publication-hook";
import { sendMessage } from "@/lib/messages";

const harness = vi.hoisted(() => ({
  index: 0,
  values: [] as unknown[]
}));

vi.mock("react", () => ({
  useEffect: vi.fn(),
  useRef: (current: unknown) => ({ current }),
  useState: () => [
    harness.values[harness.index++],
    vi.fn()
  ]
}));
vi.mock("@/hooks/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));
vi.mock("@/hooks/extension-state-provider", () => ({
  useExtensionState: () => ({
    state: {
      customActivities: {
        items: []
      }
    }
  })
}));
vi.mock("@/lib/messages", () => ({ sendMessage: vi.fn() }));

describe("publication mutation locking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    harness.index = 0;
    harness.values = [true, false, "https://nowly.me/activities/example", null, true, false, 3];
  });

  it("prevents repeated withdrawal requests before React has rendered the busy state", async () => {
    let finish: (value: { ok: true; url: string; revision: number; published: boolean }) => void = () => {};
    vi.mocked(sendMessage).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const publication = useCustomActivityPublication("activity-id");
    const first = publication.publish(true);
    expect(await publication.publish(true)).toBe(false);
    expect(sendMessage).toHaveBeenCalledExactlyOnceWith("PUBLISH_CUSTOM_ACTIVITY", {
      id: "activity-id",
      baseRevision: 3,
      unpublish: true
    });
    finish({
      ok: true,
      url: "https://nowly.me/activities/example",
      revision: 4,
      published: false
    });
    expect(await first).toBe(true);
  });

  it("reports failure and releases the lock for an explicit retry", async () => {
    vi.mocked(sendMessage).mockResolvedValueOnce({
      ok: false,
      error: "UNAVAILABLE"
    });
    const publication = useCustomActivityPublication("activity-id");
    expect(await publication.publish(true)).toBe(false);
    vi.mocked(sendMessage).mockResolvedValueOnce({
      ok: true,
      url: "https://nowly.me/activities/example",
      revision: 4,
      published: false
    });
    expect(await publication.publish(true)).toBe(true);
    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  it("does not confirm withdrawal when the response still says published", async () => {
    vi.mocked(sendMessage).mockResolvedValueOnce({
      ok: true,
      url: "https://nowly.me/activities/example",
      revision: 4,
      published: true
    });
    expect(await useCustomActivityPublication("activity-id").publish(true)).toBe(false);
  });
});