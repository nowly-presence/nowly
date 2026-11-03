import type { AppEnv } from "@/context";
import { handleError, handleNotFound } from "@/shared/error-handler";
import { resetRateLimits } from "@/middleware/rate-limit";
import { Hono } from "hono";

type InjectOptions = {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  payload?: unknown;
  remoteAddress?: string;
};

export type InjectResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  rawPayload: Buffer;
  json: <T = any>() => T;
};

type Fetchable = {
  request: (input: string, init?: RequestInit) => Response | Promise<Response>;
};

export const mount = (prefix: string, router: Hono<any>) => {
  resetRateLimits();
  return new Hono<AppEnv>().onError(handleError).notFound(handleNotFound).route(prefix, router);
};

export const inject = async (app: Fetchable, options: InjectOptions): Promise<InjectResponse> => {
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;

  if (options.payload !== undefined) {
    if (typeof options.payload === "string" || options.payload instanceof Uint8Array) {
      body = typeof options.payload === "string" ? options.payload : new Uint8Array(options.payload);
    } else {
      body = JSON.stringify(options.payload);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    }
  }

  if (options.remoteAddress && !headers.has("x-forwarded-for")) headers.set("x-forwarded-for", options.remoteAddress);

  const url = options.url.startsWith("http") ? options.url : `http://localhost${options.url}`;
  const response = await app.request(url, {
    method: options.method ?? "GET",
    headers,
    body
  });

  const rawPayload = Buffer.from(await response.arrayBuffer());
  const text = rawPayload.toString("utf8");

  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: text,
    rawPayload,
    json: () => JSON.parse(text)
  };
};