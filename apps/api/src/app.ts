import type { AppEnv } from "@/context";
import { accountRoutes } from "@/features/account/account.routes";
import { adminRoutes } from "@/features/admin/admin.routes";
import { activitySharingRoutes } from "@/features/activity-sharing/activity-sharing.routes";
import { createAnnouncementsRoutes } from "@/features/announcements/announcements.routes";
import { assetsRoutes } from "@/features/assets/assets.routes";
import { getAuth } from "@/features/auth/better-auth";
import { contactRoutes } from "@/features/contact/contact.routes";
import { customAssetsCronRoutes, customAssetsRoutes } from "@/features/custom-assets/custom-assets.routes";
import { deviceRoutes } from "@/features/device/device.routes";
import { imageProxyRoutes } from "@/features/image-proxy/image-proxy.routes";
import { publicProfileRoutes } from "@/features/public-profile/public-profile.routes";
import { presenceRoutes } from "@/features/presence/presence.routes";
import { presenceReportRoutes } from "@/features/presence-reports/presence-reports.routes";
import { presenceSubmissionRoutes } from "@/features/presence-submissions/presence-submissions.routes";
import { creatorDraftRoutes } from "@/features/creator-drafts/creator-drafts.routes";
import { securityRoutes } from "@/features/security/security.routes";
import { statusRoutes } from "@/features/status/status.routes";
import { syncRoutes } from "@/features/sync/sync.routes";
import { createTelemetryRoutes } from "@/features/telemetry/telemetry.routes";
import { corsMiddleware } from "@/middleware/cors";
import { defaultBodyLimit } from "@/middleware/body-limit";
import { MINUTE_MS, rateLimit } from "@/middleware/rate-limit";
import { handleError, handleNotFound } from "@/shared/error-handler";
import { AUTH_BASE_PATH } from "@nowly/auth/server";
import { Hono } from "hono";
import { logger } from "hono/logger";

const GLOBAL_RATE_LIMIT = 100;

type AppOptions = {
  logRequests?: boolean;
};

export const createApp = ({ logRequests = false }: AppOptions = {}) => {
  const app = new Hono<AppEnv>();

  if (logRequests) app.use(logger());

  app.use(corsMiddleware);
  app.use(
    rateLimit({
      name: "global",
      max: GLOBAL_RATE_LIMIT,
      windowMs: MINUTE_MS
    })
  );
  app.use(defaultBodyLimit);

  app.onError(handleError);
  app.notFound(handleNotFound);

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "nowly-api",
      checkedAt: new Date().toISOString()
    })
  );
  app.get("/robots.txt", (c) => c.text("User-agent: *\nDisallow: /\n"));
  app.on(["GET", "POST"], `${AUTH_BASE_PATH}/*`, (c) => getAuth().handler(c.req.raw));

  app.route("/telemetry", createTelemetryRoutes());
  app.route("/contact", contactRoutes);
  app.route("/devices", deviceRoutes);
  app.route("/devices", customAssetsRoutes);
  app.route("/", customAssetsCronRoutes);
  app.route("/", accountRoutes);
  app.route("/", publicProfileRoutes);
  app.route("/", activitySharingRoutes);
  app.route("/announcements", createAnnouncementsRoutes());
  app.route("/sync", syncRoutes);
  app.route("/", statusRoutes);
  app.route("/", imageProxyRoutes);
  app.route("/presences", assetsRoutes);
  app.route("/presences", presenceRoutes);
  app.route("/security", securityRoutes);
  app.route("/admin", adminRoutes);
  app.route("/", presenceSubmissionRoutes);
  app.route("/", presenceReportRoutes);
  app.route("/", creatorDraftRoutes);

  return app;
};