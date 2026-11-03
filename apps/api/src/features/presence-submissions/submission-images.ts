import sharp from "sharp";

export const CREATOR_IMAGE_KINDS = ["thumbnail", "logo", "icon"] as const;

export type CreatorImageKind = (typeof CREATOR_IMAGE_KINDS)[number];

export type CreatorImage = {
  kind: CreatorImageKind;
  bytes: Buffer;
  contentType: "image/png" | "image/jpeg";
  fileName: string;
};

export type ImageFailure = {
  ok: false;
  kind: CreatorImageKind;
  reason: "format" | "size" | "dimensions" | "transparency";
};

export type ImageCheck =
  | {
      ok: true;
      images: CreatorImage[];
    }
  | ImageFailure;

type ImageSpec = {
  width: number;
  height: number;
  format: "png" | "jpeg";
  fileName: string;
  transparentEdge: boolean;
};

export const IMAGE_SPECS: Record<CreatorImageKind, ImageSpec> = {
  thumbnail: {
    width: 1920,
    height: 1080,
    format: "jpeg",
    fileName: "thumbnail.jpg",
    transparentEdge: false
  },
  logo: {
    width: 300,
    height: 300,
    format: "png",
    fileName: "logo.png",
    transparentEdge: false
  },
  icon: {
    width: 128,
    height: 128,
    format: "png",
    fileName: "icon.png",
    transparentEdge: true
  }
};

export const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const ALPHA_OPAQUE = 250;
const JPEG_QUALITY = 90;
const PNG_COMPRESSION = 9;
const DATA_URL = /^data:image\/(?:png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

const startsWith = (bytes: Buffer, signature: number[]): boolean => signature.every((byte, index) => bytes[index] === byte);

const realFormat = (bytes: Buffer): "png" | "jpeg" | null => {
  if (startsWith(bytes, PNG_SIGNATURE)) return "png";
  if (startsWith(bytes, JPEG_SIGNATURE)) return "jpeg";

  return null;
};

const hasTransparentEdge = async (bytes: Buffer, width: number, height: number): Promise<boolean> => {
  const data = await sharp(bytes).ensureAlpha().raw().toBuffer();

  const alphaAt = (x: number, y: number) => data[(y * width + x) * 4 + 3];

  for (let x = 0; x < width; x++) if (alphaAt(x, 0) < ALPHA_OPAQUE || alphaAt(x, height - 1) < ALPHA_OPAQUE) return true;

  for (let y = 0; y < height; y++) if (alphaAt(0, y) < ALPHA_OPAQUE || alphaAt(width - 1, y) < ALPHA_OPAQUE) return true;

  return false;
};

const checkImage = async (kind: CreatorImageKind, dataUrl: string): Promise<CreatorImage | ImageFailure> => {
  const spec = IMAGE_SPECS[kind];
  const match = DATA_URL.exec(dataUrl);

  if (!match) return {
    ok: false,
    kind,
    reason: "format"
  };

  const bytes = Buffer.from(match[1], "base64");

  if (bytes.length > IMAGE_MAX_BYTES) return {
    ok: false,
    kind,
    reason: "size"
  };
  if (realFormat(bytes) !== spec.format) return {
    ok: false,
    kind,
    reason: "format"
  };

  const metadata = await sharp(bytes)
    .metadata()
    .catch(() => null);

  if (!metadata || metadata.format !== spec.format) return {
    ok: false,
    kind,
    reason: "format"
  };
  if (metadata.width !== spec.width || metadata.height !== spec.height) return {
    ok: false,
    kind,
    reason: "dimensions"
  };
  if (spec.transparentEdge && !(await hasTransparentEdge(bytes, spec.width, spec.height))) return {
    ok: false,
    kind,
    reason: "transparency"
  };

  const encoder = sharp(bytes).rotate();
  const encoded =
    spec.format === "jpeg"
      ? await encoder
          .jpeg({
            quality: JPEG_QUALITY,
            mozjpeg: true
          })
          .toBuffer()
      : await encoder.png({ compressionLevel: PNG_COMPRESSION }).toBuffer();
  return {
    kind,
    bytes: encoded,
    contentType: spec.format === "jpeg" ? "image/jpeg" : "image/png",
    fileName: spec.fileName
  };
};

const isFailure = (value: CreatorImage | ImageFailure): value is ImageFailure => "ok" in value;

export const checkCreatorImages = async (assets: Record<CreatorImageKind, string>): Promise<ImageCheck> => {
  const images: CreatorImage[] = [];

  for (const kind of CREATOR_IMAGE_KINDS) {
    const result = await checkImage(kind, assets[kind]).catch((): ImageFailure => ({
      ok: false,
      kind,
      reason: "format"
    }));

    if (isFailure(result)) return result;

    images.push(result);
  }

  return {
    ok: true,
    images
  };
};