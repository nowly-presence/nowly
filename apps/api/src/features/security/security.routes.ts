import { FastifyInstance } from "fastify";
import { serverEnv } from "@nowly/env/server";
import { createPrivateKey, createPublicKey } from "node:crypto";

let cached: string | null = null;

const getPublicKey = (): string => {
  if (cached) return cached;

  const pkDer = Buffer.from(serverEnv.PRESENCE_SIGNING_PRIVATE_KEY, "base64url");
  const pk = createPrivateKey({
    key: pkDer,
    format: "der",
    type: "pkcs8"
  });
  const pubDer = createPublicKey(pk).export({
    format: "der",
    type: "spki"
  });

  cached = pubDer.toString("base64url");
  return cached;
};

export const securityRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/public-key", async () => ({ publicKey: getPublicKey() }));
};