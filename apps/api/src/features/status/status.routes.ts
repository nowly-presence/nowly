import { requireSecret } from "@/features/auth/auth.middleware";
import { getStatusReport, runStatusCheck } from "@/features/status/status.service";
import { serverEnv } from "@nowly/env/server";
import { Hono } from "hono";

const requireCronAuth = requireSecret(() => serverEnv.STATUS_CRON_SECRET, "STATUS_CRON_SECRET_MISSING");

export const statusRoutes = new Hono()
  .get("/status", async (c) => c.json(await getStatusReport()))
  .post("/status/check", requireCronAuth, async (c) => c.json(await runStatusCheck()))
  .get("/status/check", requireCronAuth, async (c) => c.json(await runStatusCheck()));