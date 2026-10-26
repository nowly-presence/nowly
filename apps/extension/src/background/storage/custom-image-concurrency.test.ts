import { describe, expect, it } from "vitest";
import { getCustomImages, updateCustomImages } from "@/background/storage/custom-activities.store";
import { installChromeMock } from "@/test/chrome-mock";
import type { StoredCustomImage } from "@/shared/types";

describe("publication image storage writes", () => {
  it("keeps simultaneous local uploads instead of losing one read-modify-write", async () => {
    installChromeMock();
    const image: StoredCustomImage = {
      dataUrl: "data:image/png;base64,iVBORw0KGgo=",
      mime: "image/png",
      size: 8,
      createdAt: 1
    };
    await Promise.all([
      updateCustomImages((images) => ({
        ...images,
        first: image
      })),
      updateCustomImages((images) => ({
        ...images,
        second: image
      }))
    ]);
    expect(await getCustomImages()).toEqual({
      first: image,
      second: image
    });
  });
});