import { beforeEach, describe, expect, it, vi } from "vitest";
import { CUSTOM_ACTIVITIES_MAX, emptyCustomActivityDraft } from "@/shared/custom-activity";
import { buildActivityFile } from "@/shared/custom-activity-share";
import type { CustomActivity } from "@/shared/types";
import { useCustomActivityShare } from "./use-custom-activity-share";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  toast: vi.fn(),
  download: vi.fn(),
  remember: vi.fn(),
  refresh: vi.fn(),
  items: [] as unknown[]
}));

vi.mock("react", () => ({
  useCallback: (callback: unknown) => callback,
  useRef: (current: unknown) => ({ current }),
  useState: (value: unknown) => [
    value,
    vi.fn()
  ]
}));
vi.mock("@/hooks/extension-state-provider", () => ({
  useExtensionState: () => ({
    state: {
      customActivities: { items: mocks.items }
    },
    refresh: { customActivities: mocks.refresh }
  })
}));
vi.mock("@/hooks/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));
vi.mock("@/ui/toast", () => ({
  useToast: () => ({ toast: mocks.toast })
}));
vi.mock("@/lib/messages", () => ({ sendMessage: mocks.send }));
vi.mock("@/lib/download-json-file", () => ({ downloadJsonFile: mocks.download }));
vi.mock("@/hooks/use-custom-image-data", () => ({ rememberCustomImage: mocks.remember }));

const activity: CustomActivity = {
  ...emptyCustomActivityDraft(() => 0),
  id: "source",
  name: "Reading",
  details: "Dune",
  createdAt: 1,
  updatedAt: 2
};
const saved = {
  ...activity,
  id: "new-id"
};

const makeFile = () => new File([JSON.stringify(buildActivityFile(activity, {}))], "reading.json", { type: "application/json" });

const PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHnOcQAAAAABJRU5ErkJggg==";

describe("custom activity sharing orchestration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.items = [];
    mocks.send.mockResolvedValue({
      ok: true,
      activity: saved
    });
    mocks.refresh.mockResolvedValue(undefined);
  });

  it("creates a fresh draft without identity or activation and opens a single import", async () => {
    const opened = vi.fn();
    await useCustomActivityShare(opened).importFiles([makeFile()]);
    expect(mocks.send).toHaveBeenCalledExactlyOnceWith("SAVE_CUSTOM_ACTIVITY", { draft: expect.objectContaining({ name: activity.name }) });
    const draft = mocks.send.mock.calls[0][1].draft;
    expect(draft).not.toHaveProperty("id");
    expect(draft).not.toHaveProperty("activeId");
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(opened).toHaveBeenCalledWith(saved);
  });

  it("continues after an invalid file and summarizes multiple successes", async () => {
    const opened = vi.fn();
    await useCustomActivityShare(opened).importFiles([
      new File(["bad"], "bad.json"),
      makeFile(),
      makeFile()
    ]);
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.toast).toHaveBeenCalledWith("custom.import.errorFormat", "error");
    expect(mocks.toast).toHaveBeenCalledWith("custom.toast.importedMany");
    expect(opened).not.toHaveBeenCalled();
  });

  it("does not start a concurrent import", async () => {
    let release = () => {};
    mocks.send.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              ok: true,
              activity: saved
            });
        })
    );
    const share = useCustomActivityShare(vi.fn());
    const first = share.importFiles([makeFile()]);
    await vi.waitFor(() => expect(mocks.send).toHaveBeenCalledOnce());
    await share.importFiles([makeFile()]);
    expect(mocks.send).toHaveBeenCalledOnce();
    release();
    await first;
  });

  it("rejects an import into a full list before any background request", async () => {
    mocks.items = Array.from({ length: CUSTOM_ACTIVITIES_MAX }, () => activity);
    await useCustomActivityShare(vi.fn()).importFiles([makeFile()]);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith("custom.toast.limit", "error");
  });

  it("imports only up to the remaining capacity", async () => {
    mocks.items = Array.from({ length: CUSTOM_ACTIVITIES_MAX - 1 }, () => activity);
    await useCustomActivityShare(vi.fn()).importFiles([
      makeFile(),
      makeFile()
    ]);
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.toast).toHaveBeenCalledWith("custom.toast.limit", "error");
  });

  it("keeps an activity when an embedded image upload throws", async () => {
    const file = buildActivityFile(activity, {});
    file.activity.smallImage = {
      kind: "embedded",
      dataUrl: PNG_DATA_URL
    };
    mocks.send.mockImplementation(async (message: string) => {
      if (message === "UPLOAD_CUSTOM_IMAGE") throw new Error("offline");

      return {
        ok: true,
        activity: saved
      };
    });
    await useCustomActivityShare(vi.fn()).importFiles([new File([JSON.stringify(file)], "image.json")]);
    expect(mocks.send).toHaveBeenCalledWith("SAVE_CUSTOM_ACTIVITY", {
      draft: expect.objectContaining({
        smallImage: { kind: "none" }
      })
    });
    expect(mocks.toast).toHaveBeenCalledWith("custom.import.imageSkipped", "info");
  });

  it("uploads embedded images and remembers their new hash", async () => {
    const file = buildActivityFile(activity, {});
    file.activity.smallImage = {
      kind: "embedded",
      dataUrl: PNG_DATA_URL
    };
    const image = {
      kind: "upload",
      hash: "new-hash",
      mime: "image/png",
      size: 10,
      remoteUrl: "https://cdn.nowly.me/new.png"
    };
    mocks.send.mockImplementation(async (message: string) => (message === "UPLOAD_CUSTOM_IMAGE" ? { ok: true, image } : { ok: true, activity: saved }));
    await useCustomActivityShare(vi.fn()).importFiles([new File([JSON.stringify(file)], "image.json")]);
    expect(mocks.remember).toHaveBeenCalledWith("new-hash", PNG_DATA_URL);
    expect(mocks.send).toHaveBeenCalledWith("SAVE_CUSTOM_ACTIVITY", { draft: expect.objectContaining({ smallImage: image }) });
  });

  it("continues after a background failure and allows another batch", async () => {
    mocks.send.mockRejectedValueOnce(new Error("offline"));
    const share = useCustomActivityShare(vi.fn());
    await share.importFiles([
      makeFile(),
      makeFile()
    ]);
    await share.importFiles([makeFile()]);
    expect(mocks.send).toHaveBeenCalledTimes(3);
    expect(mocks.toast).toHaveBeenCalledWith("error.generic", "error");
  });

  it("exports local image data without leaking hosted image URLs", async () => {
    const uploaded: CustomActivity = {
      ...activity,
      smallImage: {
        kind: "upload",
        hash: "hash",
        mime: "image/png",
        size: 10,
        remoteUrl: "https://cdn.nowly.me/private.png"
      }
    };
    mocks.send.mockResolvedValue({ hash: PNG_DATA_URL });
    await useCustomActivityShare(vi.fn()).exportActivity(uploaded);
    expect(mocks.send).toHaveBeenCalledWith("GET_CUSTOM_IMAGES", {
      hashes: ["hash"]
    });
    expect(mocks.download).toHaveBeenCalledWith(
      "Reading.json",
      expect.objectContaining({
        activity: expect.objectContaining({
          smallImage: {
            kind: "embedded",
            dataUrl: PNG_DATA_URL
          }
        })
      })
    );
    expect(JSON.stringify(mocks.download.mock.calls)).not.toContain("cdn.nowly.me");
  });
});