import { bodyLimit } from "hono/body-limit";

export const limitBody = (maxSize: number) =>
  bodyLimit({
    maxSize,
    onError: (c) => c.json({ error: "PAYLOAD_TOO_LARGE" }, 413)
  });