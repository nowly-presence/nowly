import { generateKeyPairSync } from "node:crypto";
import { inject, mount } from "./http";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const privateKeyBase64Url = privateKey
  .export({
    format: "der",
    type: "pkcs8"
  })
  .toString("base64url");
const expectedPublicKeyBase64Url = publicKey
  .export({
    format: "der",
    type: "spki"
  })
  .toString("base64url");

describe("security routes", () => {
  beforeEach(() => {
    vi.stubEnv("PRESENCE_SIGNING_PRIVATE_KEY", privateKeyBase64Url);
    vi.resetModules();
  });

  it("GET /public-key derives the public key from the configured private key", async () => {
    const { securityRoutes } = await import("@/features/security/security.routes");

    const app = mount("/", securityRoutes);

    const res = await inject(app, {
      method: "GET",
      url: "/public-key"
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ publicKey: expectedPublicKeyBase64Url });
  });
});