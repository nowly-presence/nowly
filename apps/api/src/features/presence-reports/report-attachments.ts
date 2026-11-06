import { hasObjectStorage, objectStorage, publicObjectUrl } from "@/shared/object-storage";
import { DeleteObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { serverEnv } from "@nowly/env/server";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { REPORT_ATTACHMENT_MAX_BYTES, REPORT_ATTACHMENT_MAX_SIDE, REPORT_ATTACHMENTS_MAX } from "./report.constants";
import { ReportError } from "./report-errors";

const DATA_URL = /^data:image\/(?:png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const JPEG_QUALITY = 85;
const PNG_COMPRESSION = 9;
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
const DELETE_BATCH = 1_000;

type PreparedImage = {
  bytes: Buffer;
  extension: "png" | "jpg";
  contentType: "image/png" | "image/jpeg";
};

const startsWith = (bytes: Buffer, signature: number[]): boolean => signature.every((byte, index) => bytes[index] === byte);

const prepare = async (dataUrl: string): Promise<PreparedImage> => {
  const match = DATA_URL.exec(dataUrl);

  if (!match) throw new ReportError("INVALID_ATTACHMENT");

  const bytes = Buffer.from(match[1], "base64");
  const format = startsWith(bytes, PNG_SIGNATURE) ? "png" : startsWith(bytes, JPEG_SIGNATURE) ? "jpeg" : null;

  if (bytes.length > REPORT_ATTACHMENT_MAX_BYTES || !format) throw new ReportError("INVALID_ATTACHMENT");

  const metadata = await sharp(bytes)
    .metadata()
    .catch(() => null);

  if (!metadata || metadata.format !== format) throw new ReportError("INVALID_ATTACHMENT");

  const resized = sharp(bytes).rotate().resize({
    width: REPORT_ATTACHMENT_MAX_SIDE,
    height: REPORT_ATTACHMENT_MAX_SIDE,
    fit: "inside",
    withoutEnlargement: true
  });

  return format === "png"
    ? { bytes: await resized.png({ compressionLevel: PNG_COMPRESSION }).toBuffer(), extension: "png", contentType: "image/png" }
    : {
        bytes: await resized
          .jpeg({
            quality: JPEG_QUALITY,
            mozjpeg: true
          })
          .toBuffer(),
        extension: "jpg",
        contentType: "image/jpeg"
      };
};

export const removeReportAttachments = async (keys: string[]): Promise<void> => {
  if (keys.length === 0 || !hasObjectStorage()) return;

  const storage = objectStorage();

  for (let start = 0; start < keys.length; start += DELETE_BATCH) {
    await storage.send(
      new DeleteObjectsCommand({
        Bucket: serverEnv.R2_BUCKET,
        Delete: { Objects: keys.slice(start, start + DELETE_BATCH).map((Key) => ({ Key })) }
      })
    );
  }
};

export const storeReportAttachments = async (dataUrls: string[]): Promise<string[]> => {
  if (dataUrls.length === 0) return [];

  if (dataUrls.length > REPORT_ATTACHMENTS_MAX) throw new ReportError("INVALID_ATTACHMENT");
  if (!hasObjectStorage()) throw new ReportError("STORAGE_UNAVAILABLE");

  const images = await Promise.all(dataUrls.map(prepare));

  const folder = `reports/${randomUUID()}`;
  const storage = objectStorage();
  const keys = images.map((image, index) => `${folder}/${index + 1}.${image.extension}`);

  try {
    await Promise.all(
      images.map((image, index) =>
        storage.send(
          new PutObjectCommand({
            Bucket: serverEnv.R2_BUCKET,
            Key: keys[index],
            Body: image.bytes,
            ContentType: image.contentType,
            CacheControl: IMMUTABLE_CACHE
          })
        )
      )
    );
  } catch (error) {
    await removeReportAttachments(keys).catch(() => undefined);
    throw error;
  }

  return keys;
};

export const attachmentUrls = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((key): key is string => typeof key === "string").map(publicObjectUrl) : [];