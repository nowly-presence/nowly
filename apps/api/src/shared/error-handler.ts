import { ApiError } from "@/shared/errors";
import type { ErrorHandler, NotFoundHandler } from "hono";

export const handleError: ErrorHandler = (error, c) => {
  if (error instanceof ApiError) return new Response(JSON.stringify({ error: error.message }), {
    status: error.status,
    headers: { "Content-Type": "application/json" }
  });

  console.error(error);
  return c.json({ error: "INTERNAL_SERVER_ERROR" }, 500);
};

export const handleNotFound: NotFoundHandler = (c) => c.json({ error: "NOT_FOUND" }, 404);