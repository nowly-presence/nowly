import { clientIp } from "@/middleware/client-ip";
import { jsonBody } from "@/shared/request-body";
import type { Context } from "hono";

export const deviceRateLimitKey = async (c: Context): Promise<string> => {
  const body = await jsonBody(c);

  const deviceId = body && typeof body === "object" && "deviceId" in body && typeof body.deviceId === "string" ? body.deviceId.trim() : "";
  return deviceId || clientIp(c);
};