import { bodyLimit } from "hono/body-limit";
import { matchedRoutes } from "hono/route";

export const DEFAULT_BODY_LIMIT = 1024 * 1024;

const routeLimits = new WeakSet();

const createBodyLimit = (maxSize: number) =>
  bodyLimit({
    maxSize,
    onError: (c) => c.json({ error: "PAYLOAD_TOO_LARGE" }, 413)
  });

export const limitBody = (maxSize: number) => {
  const middleware = createBodyLimit(maxSize);
  routeLimits.add(middleware);
  return middleware;
};

const defaultLimit = createBodyLimit(DEFAULT_BODY_LIMIT);

export const defaultBodyLimit: typeof defaultLimit = (c, next) =>
  matchedRoutes(c).some(({ handler }) => routeLimits.has(handler)) ? next() : defaultLimit(c, next);