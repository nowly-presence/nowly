import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupRecovery, id, publicId, key, activity, account } from "./activity-publication-recovery.fixture";
import { publishActivity } from "@/background/services/activity-publication-publisher";
import { setCustomActivities } from "@/background/storage/custom-activities.store";
import { validateCustomActivity } from "@/shared/custom-activity";
import type { CustomImage } from "@/shared/types";
import * as publicationData from "@/background/services/activity-publication-data";
import * as publicationContent from "@/shared/activity-publication";

const images: {
  name: string;
  image: CustomImage;
  error: string;
}[] = [
  {
    name: "missing uploaded bytes",
    image: {
      kind: "upload",
      hash: "a".repeat(64),
      mime: "image/png",
      size: 8
    },
    error: "MISSING_IMAGE"
  },
  {
    name: "locally valid nonportable color",
    image: {
      kind: "icon",
      icon: "gamepad",
      color: "#ffffff"
    },
    error: "UNAVAILABLE"
  }
];

const seedPublication = async (revision: number) => {
  await chrome.storage.local.set({
    activityPublications: {
      [key]: {
        id: publicId,
        revision,
        published: revision > 0
      }
    },
    activityPublicationAttempts: {
      [key]: {
        id: publicId,
        apiBase: "https://api.nowly.me",
        pending: true
      }
    }
  });
};

describe("content-independent publication withdrawal", () => {
  beforeEach(async () => {
    await setupRecovery();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const { name, image, error } of images) {
    it.each([0, 1])(`withdraws ${name} at revision %s without reading or validating content`, async (revision) => {
      const saved = {
        ...activity,
        largeImage: image
      };
      expect(validateCustomActivity(saved)).toEqual({});
      await setCustomActivities({
        items: [saved],
        activeId: id,
        activatedAt: 1
      });
      await seedPublication(revision);
      const readImages = vi.spyOn(publicationData, "publicationImageData");
      const buildPortable = vi.spyOn(publicationContent, "portableActivity");
      vi.mocked(fetch).mockResolvedValueOnce(
        Response.json({
          id: publicId,
          revision: revision + 1
        })
      );

      expect(await publishActivity(id, revision, true)).toEqual({
        ok: true,
        url: `https://nowly.me/activities/${publicId}`,
        revision: revision + 1,
        published: false
      });
      expect(readImages).not.toHaveBeenCalled();
      expect(buildPortable).not.toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledExactlyOnceWith(`https://api.nowly.me/me/activity-publications/${publicId}`, {
        method: "DELETE",
        redirect: "error",
        credentials: "omit",
        headers: {
          Authorization: `Bearer ${account.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ baseRevision: revision })
      });
      const stored = await chrome.storage.local.get("activityPublications");
      expect(stored.activityPublications).toEqual({
        [key]: {
          id: publicId,
          revision: revision + 1,
          published: false
        }
      });
      const attempts = await chrome.storage.local.get("activityPublicationAttempts");
      expect(attempts.activityPublicationAttempts).toEqual({
        [key]: {
          id: publicId,
          apiBase: "https://api.nowly.me",
          pending: false
        }
      });
    });

    it.each([false, true])(`still rejects publishing ${name}, existing reservation: %s`, async (reserved) => {
      await setCustomActivities({
        items: [
          {
            ...activity,
            largeImage: image
          }
        ],
        activeId: null,
        activatedAt: null
      });
      if (reserved) await seedPublication(0);
      expect(await publishActivity(id, 0)).toEqual({
        ok: false,
        error
      });
      expect(fetch).not.toHaveBeenCalled();
    });
  }

  it("does not clear pending state when the withdrawal response has the wrong revision", async () => {
    await seedPublication(0);
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        id: publicId,
        revision: 2
      })
    );
    expect(await publishActivity(id, 0, true)).toEqual({
      ok: false,
      error: "INVALID"
    });
    const stored = await chrome.storage.local.get("activityPublicationAttempts");
    expect(stored.activityPublicationAttempts).toEqual({
      [key]: {
        id: publicId,
        apiBase: "https://api.nowly.me",
        pending: true
      }
    });
  });
});