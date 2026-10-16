import { describe, expect, it } from "vitest";
import { CUSTOM_IMAGE_MAX_BYTES } from "@/shared/custom-activity";
import { decodeImageDataUrl, sha256Hex, sniffImageMime } from "@/shared/custom-image";

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];

const toDataUrl = (mime: string, bytes: number[] | Uint8Array) => `data:${mime};base64,${btoa(String.fromCharCode(...bytes))}`;

describe("sniffImageMime", () => {
  it("recognises the supported formats by their signature", () => {
    expect(sniffImageMime(new Uint8Array(PNG_HEADER))).toBe("image/png");
    expect(sniffImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageMime(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe("image/gif");
    expect(sniffImageMime(new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]))).toBe("image/webp");
    expect(sniffImageMime(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
  });
});

describe("decodeImageDataUrl", () => {
  it("accepts an image whose content matches its declared type", () => {
    const result = decodeImageDataUrl(toDataUrl("image/png", PNG_HEADER));
    expect(result.ok && result.mime).toBe("image/png");
  });

  it("rejects a renamed file, an unsupported type and oversized content", () => {
    expect(decodeImageDataUrl(toDataUrl("image/jpeg", PNG_HEADER))).toEqual({
      ok: false,
      error: "INVALID_IMAGE"
    });
    expect(decodeImageDataUrl(toDataUrl("image/svg+xml", [0x3c]))).toEqual({
      ok: false,
      error: "UNSUPPORTED_TYPE"
    });
    const big = new Uint8Array(CUSTOM_IMAGE_MAX_BYTES + 16);
    big.set(PNG_HEADER);
    const base64 = Buffer.from(big).toString("base64");
    expect(decodeImageDataUrl(`data:image/png;base64,${base64}`)).toEqual({
      ok: false,
      error: "TOO_LARGE"
    });
  });
});

describe("sha256Hex", () => {
  it("hashes bytes as lowercase hex", async () => {
    expect(await sha256Hex(new TextEncoder().encode("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});