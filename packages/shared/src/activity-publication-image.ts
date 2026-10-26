import { z } from "zod";

const IMAGE_MAX_BYTES = 1024 * 1024;
const IMAGE_MAX_BASE64_LENGTH = 1_398_104;
const IMAGE_MAX_DATA_URL_LENGTH = 1_398_150;
export const publicationColors = ["#0891b2", "#4a5560", "#3f7d6b", "#5a6bb0", "#9a6a4a", "#7a5aa6", "#a85a74", "#8a7a3c", "#2f6f8f", "#5f7f3f"] as const;
export const publicationIcons = [
  "gamepad",
  "trophy",
  "code",
  "computer",
  "book",
  "graduation",
  "pencil",
  "brush",
  "palette",
  "camera",
  "film",
  "tv",
  "music",
  "headphone",
  "mic",
  "chat",
  "coffee",
  "restaurant",
  "run",
  "plane",
  "moon",
  "rocket",
  "flask",
  "sparkling"
] as const;

export const publicationHttpsSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password && url.hostname.includes(".");
    } catch {
      return false;
    }
  });

export const isPublicationImage = (value: string): boolean => {
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);

  if (!match || match[2].length > IMAGE_MAX_BASE64_LENGTH) return false;

  try {
    const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));

    if (bytes.length > IMAGE_MAX_BYTES) return false;

    const starts = (signature: number[], offset = 0) => signature.every((byte, index) => bytes[offset + index] === byte);

    if (match[1] === "image/png") return starts([137, 80, 78, 71, 13, 10, 26, 10]);
    if (match[1] === "image/jpeg") return starts([255, 216, 255]);
    if (match[1] === "image/gif") return starts([71, 73, 70, 56]) && (starts([57, 97], 4) || starts([55, 97], 4));

    return starts([82, 73, 70, 70]) && starts([87, 69, 66, 80], 8);
  } catch {
    return false;
  }
};

export const publicationImageSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }).strict(),
  z
    .object({
      kind: z.literal("url"),
      url: publicationHttpsSchema
    })
    .strict(),
  z
    .object({
      kind: z.literal("icon"),
      icon: z.enum(publicationIcons),
      color: z
        .string()
        .toLowerCase()
        .refine((value) => publicationColors.some((color) => color === value))
    })
    .strict(),
  z
    .object({
      kind: z.literal("embedded"),
      dataUrl: z.string().max(IMAGE_MAX_DATA_URL_LENGTH).refine(isPublicationImage)
    })
    .strict()
]);