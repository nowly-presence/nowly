import { checkCreatorImages } from "@/features/presence-submissions/submission-images";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import { creatorImages, jpegImage, pngImage } from "./creator-images.fixture";

let valid: Awaited<ReturnType<typeof creatorImages>>;

beforeAll(async () => {
  valid = await creatorImages();
});

describe("creator image checks", () => {
  it("accepts the three images and re-encodes them", async () => {
    const original = Buffer.from(valid.thumbnail.split(",")[1], "base64");
    const withMetadata = await sharp(original).withMetadata({ density: 300 }).jpeg().toBuffer();
    expect((await sharp(withMetadata).metadata()).exif).toBeInstanceOf(Buffer);
    const check = await checkCreatorImages({
      ...valid,
      thumbnail: `data:image/jpeg;base64,${withMetadata.toString("base64")}`
    });

    if (!check.ok) throw new Error(`Image validation failed for ${check.kind}: ${check.reason}`);

    expect(check.images.map((image) => [image.kind, image.fileName, image.contentType])).toEqual([
      ["thumbnail", "thumbnail.jpg", "image/jpeg"],
      ["logo", "logo.png", "image/png"],
      ["icon", "icon.png", "image/png"]
    ]);
    const output = await sharp(check.images[0].bytes).metadata();
    expect(output).toMatchObject({
      width: 1920,
      height: 1080,
      format: "jpeg"
    });
    expect(output.exif).toBeUndefined();
  });

  it("refuses wrong dimensions", async () => {
    expect(
      await checkCreatorImages({
        ...valid,
        logo: await pngImage(256, 256)
      })
    ).toEqual({
      ok: false,
      kind: "logo",
      reason: "dimensions"
    });
  });

  it("refuses an icon without a transparent edge", async () => {
    expect(
      await checkCreatorImages({
        ...valid,
        icon: await pngImage(128, 128)
      })
    ).toEqual({
      ok: false,
      kind: "icon",
      reason: "transparency"
    });
  });

  it("refuses a file whose bytes do not match the expected format", async () => {
    const png = await pngImage(1920, 1080);

    const disguised = png.replace("data:image/png", "data:image/jpeg");
    expect(
      await checkCreatorImages({
        ...valid,
        thumbnail: disguised
      })
    ).toEqual({
      ok: false,
      kind: "thumbnail",
      reason: "format"
    });
    expect(
      await checkCreatorImages({
        ...valid,
        logo: "data:image/png;base64,aGVsbG8="
      })
    ).toEqual({
      ok: false,
      kind: "logo",
      reason: "format"
    });
    expect(
      await checkCreatorImages({
        ...valid,
        logo: "https://example.com/logo.png"
      })
    ).toEqual({
      ok: false,
      kind: "logo",
      reason: "format"
    });
  });

  it("refuses a jpeg logo and a corrupted png", async () => {
    expect(
      await checkCreatorImages({
        ...valid,
        logo: await jpegImage(300, 300)
      })
    ).toEqual({
      ok: false,
      kind: "logo",
      reason: "format"
    });

    const truncated = valid.logo.slice(0, 80);
    expect(
      await checkCreatorImages({
        ...valid,
        logo: truncated
      })
    ).toEqual({
      ok: false,
      kind: "logo",
      reason: "format"
    });
  });
});