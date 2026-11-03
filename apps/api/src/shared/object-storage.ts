import { S3Client } from "@aws-sdk/client-s3";
import { serverEnv } from "@nowly/env/server";

export const hasObjectStorage = (): boolean => Boolean(serverEnv.R2_ACCOUNT_ID && serverEnv.R2_ACCESS_KEY_ID && serverEnv.R2_SECRET_ACCESS_KEY);

export const objectStorage = (): S3Client =>
  new S3Client({
    region: "auto",
    endpoint: `https://${serverEnv.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: serverEnv.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY ?? ""
    }
  });

export const publicObjectUrl = (key: string): string => `${serverEnv.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;