import { createHash } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { serverEnv } from "@nowly/env/server";
import { getPrisma, hasDatabase } from "@/db/client";

export const CUSTOM_IMAGE_MAX_BYTES = 1024 * 1024;
export const CUSTOM_IMAGE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const CUSTOM_IMAGE_MIME_EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif"
} as const;

export type CustomImageMime = keyof typeof CUSTOM_IMAGE_MIME_EXTENSIONS;

export const isCustomImageMime = (value: string): value is CustomImageMime => value in CUSTOM_IMAGE_MIME_EXTENSIONS;

export const detectImageMime = (bytes: Uint8Array): CustomImageMime | null => {
  const startsWith = (signature: number[], offset = 0) => signature.every((byte, index) => bytes[offset + index] === byte);
  const ascii = (text: string, offset = 0) =>
    startsWith(
      [...text].map((char) => char.charCodeAt(0)),
      offset
    );

  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (ascii("RIFF") && ascii("WEBP", 8)) return "image/webp";
  if (ascii("GIF87a") || ascii("GIF89a")) return "image/gif";

  return null;
};

export type UploadCheck = {
  ok: true;
} | {
  ok: false;
  status: 400 | 413 | 415;
  error: string;
};

export const checkUpload = (bytes: Uint8Array, declaredMime: string, sha256: string): UploadCheck => {
  if (bytes.length > CUSTOM_IMAGE_MAX_BYTES) return {
    ok: false,
    status: 413,
    error: "IMAGE_TOO_LARGE"
  };
  if (!isCustomImageMime(declaredMime) || detectImageMime(bytes) !== declaredMime) {
    return {
      ok: false,
      status: 415,
      error: "UNSUPPORTED_IMAGE"
    };
  }

  const actual = createHash("sha256").update(bytes).digest("hex");

  if (actual !== sha256) return {
    ok: false,
    status: 400,
    error: "HASH_MISMATCH"
  };

  return {
    ok: true
  };
};

export const customAssetKey = (deviceId: string, sha256: string, mime: CustomImageMime): string => {
  const deviceHash = createHash("sha256").update(deviceId).digest("hex");
  return `custom/${deviceHash}/${sha256}.${CUSTOM_IMAGE_MIME_EXTENSIONS[mime]}`;
};

const storage = (): S3Client =>
  new S3Client({
    region: "auto",
    endpoint: `https://${serverEnv.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: serverEnv.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY ?? ""
    }
  });

export type CustomAssetView = {
  id: string;
  url: string;
  expiresAt: string;
};

const toView = (row: { sha256: string; key: string; lastUsedAt: Date }): CustomAssetView => ({
  id: row.sha256,
  url: `${serverEnv.R2_PUBLIC_URL.replace(/\/$/, "")}/${row.key}`,
  expiresAt: new Date(row.lastUsedAt.getTime() + CUSTOM_IMAGE_RETENTION_MS).toISOString()
});

export const putCustomAsset = async (deviceId: string, sha256: string, mime: CustomImageMime, bytes: Uint8Array): Promise<CustomAssetView | null> => {
  if (!hasDatabase()) return null;

  const prisma = getPrisma();
  const existing = await prisma.customAsset.findUnique({
    where: {
      deviceId_sha256: { deviceId, sha256 }
    }
  });

  if (existing) {
    const row = await prisma.customAsset.update({
      where: {
        deviceId_sha256: { deviceId, sha256 }
      },
      data: { lastUsedAt: new Date() }
    });
    return toView(row);
  }

  const key = customAssetKey(deviceId, sha256, mime);
  await storage().send(
    new PutObjectCommand({
      Bucket: serverEnv.R2_BUCKET,
      Key: key,
      Body: bytes,
      ContentType: mime,
      CacheControl: "public, max-age=31536000, immutable"
    })
  );
  const row = await prisma.customAsset.upsert({
    where: {
      deviceId_sha256: { deviceId, sha256 }
    },
    create: {
      deviceId,
      sha256,
      mime,
      size: bytes.length,
      key
    },
    update: { lastUsedAt: new Date() }
  });
  return toView(row);
};

export const touchCustomAsset = async (deviceId: string, sha256: string): Promise<CustomAssetView | null> => {
  if (!hasDatabase()) return null;

  const prisma = getPrisma();
  const row = await prisma.customAsset.findUnique({
    where: {
      deviceId_sha256: { deviceId, sha256 }
    }
  });

  if (!row) return null;

  const updated = await prisma.customAsset.update({
    where: {
      deviceId_sha256: { deviceId, sha256 }
    },
    data: { lastUsedAt: new Date() }
  });
  return toView(updated);
};

export const deleteCustomAssetFile = async (key: string): Promise<void> => {
  await storage().send(
    new DeleteObjectCommand({
      Bucket: serverEnv.R2_BUCKET,
      Key: key
    })
  );
};

export const removeCustomAsset = async (deviceId: string, sha256: string): Promise<void> => {
  if (!hasDatabase()) return;

  const prisma = getPrisma();
  const row = await prisma.customAsset.findUnique({
    where: {
      deviceId_sha256: { deviceId, sha256 }
    }
  });

  if (!row) return;

  await deleteCustomAssetFile(row.key);
  await prisma.customAsset.delete({
    where: {
      deviceId_sha256: { deviceId, sha256 }
    }
  });
};

export const cleanupExpiredCustomAssets = async (): Promise<number> => {
  if (!hasDatabase()) return 0;

  const prisma = getPrisma();
  const cutoff = new Date(Date.now() - CUSTOM_IMAGE_RETENTION_MS);
  const expired = await prisma.customAsset.findMany({
    where: {
      lastUsedAt: { lt: cutoff }
    }
  });

  for (const row of expired) {
    await deleteCustomAssetFile(row.key);
  }

  await prisma.customAsset.deleteMany({
    where: {
      lastUsedAt: { lt: cutoff }
    }
  });
  return expired.length;
};