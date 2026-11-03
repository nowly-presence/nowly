import type { Context } from "hono";

export const jsonBody = async (c: Context): Promise<unknown> => {
  try {
    return await c.req.json();
  } catch {
    return undefined;
  }
};