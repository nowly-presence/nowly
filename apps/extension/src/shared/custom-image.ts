import {
  CUSTOM_IMAGE_MAX_BYTES,
  isCustomImageMime,
} from "@/shared/custom-activity";
import type { CustomImageMime } from "@/shared/types";

export type CustomImageError =
  "UNSUPPORTED_TYPE" | "TOO_LARGE" | "INVALID_IMAGE";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const GIF_SIGNATURE = [0x47, 0x49, 0x46, 0x38];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];
const WEBP_OFFSET = 8;

const startsWith = (
  bytes: Uint8Array,
  signature: number[],
  offset = 0,
): boolean =>
  bytes.length >= offset + signature.length &&
  signature.every((byte, index) => bytes[offset + index] === byte);

export const sniffImageMime = (bytes: Uint8Array): CustomImageMime | null => {
  if (startsWith(bytes, PNG_SIGNATURE)) return "image/png";
  if (startsWith(bytes, JPEG_SIGNATURE)) return "image/jpeg";
  if (startsWith(bytes, GIF_SIGNATURE)) return "image/gif";
  if (
    startsWith(bytes, RIFF_SIGNATURE) &&
    startsWith(bytes, WEBP_SIGNATURE, WEBP_OFFSET)
  )
    return "image/webp";
  return null;
};

const DATA_URL_PATTERN = /^data:([a-z/+.-]+);base64,([a-z0-9+/=]+)$/i;

export const decodeImageDataUrl = (
  dataUrl: string,
):
  | { ok: true; bytes: Uint8Array; mime: CustomImageMime }
  | { ok: false; error: CustomImageError } => {
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) return { ok: false, error: "INVALID_IMAGE" };
  const declared = match[1].toLowerCase();
  if (!isCustomImageMime(declared))
    return { ok: false, error: "UNSUPPORTED_TYPE" };
  const base64 = match[2];
  if (Math.floor((base64.length * 3) / 4) > CUSTOM_IMAGE_MAX_BYTES + 2)
    return { ok: false, error: "TOO_LARGE" };
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  if (bytes.length > CUSTOM_IMAGE_MAX_BYTES)
    return { ok: false, error: "TOO_LARGE" };
  const mime = sniffImageMime(bytes);
  if (!mime || mime !== declared) return { ok: false, error: "INVALID_IMAGE" };
  return { ok: true, bytes, mime };
};

export const sha256Hex = async (bytes: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};