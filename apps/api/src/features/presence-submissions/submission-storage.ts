import { objectStorage, publicObjectUrl } from "@/shared/object-storage";
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { serverEnv } from "@nowly/env/server";
import { randomUUID } from "node:crypto";
import type { CreatorImage, CreatorImageKind } from "./submission-images";

const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

export type StoredAssets = Partial<Record<CreatorImageKind, string>>;

export const storeCreatorImages = async (submissionId: string, revision: number, images: CreatorImage[]): Promise<StoredAssets> => {
  const storage = objectStorage();
  const prefix = `creator/${submissionId}/${revision}/${randomUUID()}`;
  const uploads = images.map((image) => ({
    image,
    key: `${prefix}/${image.fileName}`
  }));

  const results = await Promise.allSettled(
    uploads.map(async ({ image, key }) =>
      storage.send(
        new PutObjectCommand({
          Bucket: serverEnv.R2_BUCKET,
          Key: key,
          Body: image.bytes,
          ContentType: image.contentType,
          CacheControl: IMMUTABLE_CACHE
        })
      )
    )
  );

  const failure = results.find((result) => result.status === "rejected");

  if (failure) {
    await removeCreatorImages(uploads.map(({ key }) => key)).catch(() => undefined);
    throw failure.reason;
  }

  return Object.fromEntries(uploads.map(({ image, key }) => [image.kind, key]));
};

const DELETE_BATCH = 1_000;

export const removeCreatorImages = async (keys: string[]): Promise<void> => {
  if (!keys.length) return;

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

export const storedKeys = (assets: unknown): string[] =>
  assets && typeof assets === "object" ? Object.values(assets).filter((key): key is string => typeof key === "string") : [];

export const assetUrls = (assets: unknown): StoredAssets => {
  if (!assets || typeof assets !== "object") return {};

  return Object.fromEntries(
    Object.entries(assets).flatMap(([kind, key]) =>
      typeof key === "string"
        ? [
            [
              kind,
              publicObjectUrl(key)
            ]
          ]
        : []
    )
  );
};

export const readCreatorImage = async (key: string): Promise<Buffer> => {
  const object = await objectStorage().send(
    new GetObjectCommand({
      Bucket: serverEnv.R2_BUCKET,
      Key: key
    })
  );

  const bytes = await object.Body?.transformToByteArray();

  if (!bytes) throw new Error(`The image ${key} is missing from storage.`);

  return Buffer.from(bytes);
};