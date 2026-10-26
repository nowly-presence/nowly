import { vi } from "vitest";
import { publicationStatus } from "@/background/services/activity-publications";
import { activityFingerprint, portableActivity } from "@/shared/activity-publication";
import { emptyCustomActivityDraft } from "@/shared/custom-activity";
import { installChromeMock } from "@/test/chrome-mock";
import type { ActivityPublication, PublicationApply } from "@nowly/shared";

const effects = vi.hoisted(() => ({
  broadcast: vi.fn(),
  dismiss: vi.fn(),
  upload: vi.fn(),
  detection: vi.fn()
}));

export { effects };

vi.mock("@/background/managers/activity-manager", () => ({ broadcastActiveTab: effects.broadcast }));
vi.mock("@/background/managers/custom-activity-manager", () => ({ uploadCustomImage: effects.upload }));
vi.mock("@/background/services/custom-activity-detection", () => ({
  dismissCustomActivityDetection: effects.dismiss,
  readCustomActivityDetection: effects.detection
}));
vi.mock("@/background/services/api-state", () => ({
  getEffectiveApiUrl: () => "https://api.nowly.me",
  getEffectiveWebUrl: () => "https://nowly.me"
}));

export const COPY_ID = "a".repeat(32);
export const originalActivity = {
  ...emptyCustomActivityDraft(() => 0),
  name: "Study session",
  id: "original",
  createdAt: 1,
  updatedAt: 1,
  detectionUrl: "private.example.com"
};

export const makeCopyFixture = async () => {
  vi.clearAllMocks();
  effects.detection.mockResolvedValue(null);
  const storage = installChromeMock();
  const publication: ActivityPublication = {
    id: COPY_ID,
    revision: 1,
    activity: portableActivity(originalActivity, {}),
    author: {
      name: "Verified author",
      image: null
    }
  };
  const review: PublicationApply = {
    id: COPY_ID,
    revision: 1,
    fingerprint: await activityFingerprint(publication.activity),
    localFingerprint: null,
    choice: "install"
  };
  const fixture = { storage, publication, review };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(fixture.publication))
  );
  const status = () =>
    publicationStatus({
      id: fixture.review.id,
      revision: fixture.review.revision,
      fingerprint: fixture.review.fingerprint
    });
  const reviewedUpdate = async (choice: "keep" | "replace" = "replace"): Promise<PublicationApply> => {
    const current = await status();

    if (!current.ok) throw new Error(current.error);

    return {
      ...fixture.review,
      choice,
      localFingerprint: current.localFingerprint
    };
  };
  const advance = async () => {
    fixture.publication = {
      ...fixture.publication,
      revision: 2,
      activity: {
        ...publication.activity,
        name: "Publisher revision two"
      }
    };
    fixture.review = {
      ...fixture.review,
      revision: 2,
      fingerprint: await activityFingerprint(fixture.publication.activity)
    };
  };
  return Object.assign(fixture, { status, reviewedUpdate, advance });
};