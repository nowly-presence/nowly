import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCustomActivityDeletion } from "@/features/custom-activity/use-custom-activity-deletion";
import { sendMessage } from "@/lib/messages";

const harness = vi.hoisted(() => ({
  values: [] as unknown[],
  refs: [] as {
    current: unknown;
  }[],
  effects: [] as (() => void | (() => void))[],
  valueIndex: 0,
  refIndex: 0,
  translate: (key: string) => key
}));

vi.mock("react", () => ({
  useCallback: (callback: unknown) => callback,
  useState: (initial: unknown) => {
    const index = harness.valueIndex++;
    if (!(index in harness.values)) harness.values[index] = initial;
    return [
      harness.values[index],
      (value: unknown) => {
        harness.values[index] = value;
      }
    ];
  },
  useRef: (initial: unknown) => {
    const index = harness.refIndex++;
    harness.refs[index] ??= { current: initial };
    return harness.refs[index];
  },
  useEffect: (effect: () => void | (() => void)) => {
    harness.effects.push(effect);
  }
}));
vi.mock("@/hooks/i18n-provider", () => ({
  useI18n: () => ({ t: harness.translate })
}));
vi.mock("@/lib/messages", () => ({ sendMessage: vi.fn() }));

const confirm = vi.fn<() => Promise<boolean>>();
let cleanup: void | (() => void);

const render = () => {
  harness.valueIndex = 0;
  harness.refIndex = 0;
  harness.effects = [];
  return useCustomActivityDeletion("saved-id", confirm);
};

const mount = async () => {
  render();
  cleanup = harness.effects[0]?.();
  await Promise.resolve();
  return render();
};

describe("custom activity deletion flow", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    harness.values = [];
    harness.refs = [];
    cleanup = undefined;
    confirm.mockResolvedValue(true);
    vi.mocked(sendMessage).mockResolvedValue({
      ok: true,
      withdrawal: { revision: 3 }
    });
  });
  afterEach(() => {
    cleanup?.();
  });

  it("only checks on opening and requires separate withdrawal and deletion confirmations", async () => {
    let flow = await mount();
    expect(flow.stage).toBe("withdraw");
    expect(flow.prepared).toBe(true);
    expect(flow.hasWithdrawal).toBe(true);
    expect(sendMessage).toHaveBeenCalledExactlyOnceWith("GET_CUSTOM_ACTIVITY_DELETION_PLAN", { id: "saved-id" });
    await flow.remove();
    expect(confirm).not.toHaveBeenCalled();
    vi.mocked(sendMessage).mockResolvedValueOnce({
      ok: true,
      url: "https://nowly.me/activities/example",
      revision: 4,
      published: false
    });
    await flow.withdraw();
    expect(sendMessage).toHaveBeenLastCalledWith("PUBLISH_CUSTOM_ACTIVITY", {
      id: "saved-id",
      baseRevision: 3,
      unpublish: true
    });
    flow = render();
    expect(flow.stage).toBe("delete");
    expect(flow.hasWithdrawal).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
    await flow.remove();
    expect(confirm).toHaveBeenCalledOnce();
  });

  it("goes straight to confirmation for activities not requiring withdrawal", async () => {
    vi.mocked(sendMessage).mockResolvedValueOnce({
      ok: true,
      withdrawal: null
    });
    const flow = await mount();
    expect(flow.stage).toBe("delete");
    expect(flow.hasWithdrawal).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    await flow.remove();
    expect(confirm).toHaveBeenCalledOnce();
    expect(sendMessage).toHaveBeenCalledOnce();
  });

  it("keeps the activity when withdrawal fails and refreshes the revision on retry", async () => {
    let flow = await mount();
    vi.mocked(sendMessage).mockResolvedValueOnce({
      ok: false,
      error: "REVISION_CONFLICT"
    });
    await flow.withdraw();
    flow = render();
    expect(flow.stage).toBe("blocked");
    expect(flow.error).toBe("custom.public.conflict");
    expect(flow.hasWithdrawal).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
    vi.mocked(sendMessage).mockResolvedValueOnce({
      ok: true,
      withdrawal: { revision: 5 }
    });
    await flow.load();
    flow = render();
    expect(flow.stage).toBe("withdraw");
    vi.mocked(sendMessage).mockResolvedValueOnce({
      ok: true,
      url: "https://nowly.me/activities/example",
      revision: 6,
      published: false
    });
    await flow.withdraw();
    expect(sendMessage).toHaveBeenLastCalledWith("PUBLISH_CUSTOM_ACTIVITY", {
      id: "saved-id",
      baseRevision: 5,
      unpublish: true
    });
    expect(confirm).not.toHaveBeenCalled();
  });

  it("blocks offline checks without performing mutations", async () => {
    vi.mocked(sendMessage).mockRejectedValueOnce(new Error("offline"));
    const flow = await mount();
    expect(flow.stage).toBe("blocked");
    expect(flow.error).toBe("custom.delete.verifyPublication");
    expect(flow.prepared).toBe(true);
    await flow.remove();
    await flow.withdraw();
    expect(confirm).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledOnce();
  });

  it("blocks duplicate confirmations while withdrawal is pending", async () => {
    const flow = await mount();

    let finish: (value: { ok: false; error: string }) => void = () => {};
    vi.mocked(sendMessage).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const first = flow.withdraw();
    await flow.withdraw();
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(render().busy).toBe(true);
    finish({
      ok: false,
      error: "UNAVAILABLE"
    });
    await first;
    expect(render().busy).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("rechecks the plan after a failed final deletion without auto-withdrawing", async () => {
    vi.mocked(sendMessage).mockResolvedValueOnce({
      ok: true,
      withdrawal: null
    });
    const flow = await mount();
    confirm.mockResolvedValueOnce(false);
    await flow.remove();
    expect(render().stage).toBe("withdraw");
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenLastCalledWith("GET_CUSTOM_ACTIVITY_DELETION_PLAN", { id: "saved-id" });
    expect(confirm).toHaveBeenCalledOnce();
  });

  it("ignores a check response after closing the flow", async () => {
    let finish: (value: { ok: true; withdrawal: null }) => void = () => {};
    vi.mocked(sendMessage).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const flow = await mount();
    expect(flow.stage).toBe("checking");
    expect(flow.prepared).toBe(false);
    cleanup?.();
    finish({
      ok: true,
      withdrawal: null
    });
    await Promise.resolve();
    expect(render().stage).toBe("checking");
    expect(render().prepared).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });
});