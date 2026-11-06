import type { AppEnv } from "@/context";
import { resolveAccount } from "@/features/account/extension-token.middleware";
import { requireCapability } from "@/features/admin/admin.middleware";
import { requireSecret } from "@/features/auth/auth.middleware";
import { limitBody } from "@/middleware/body-limit";
import { MINUTE_MS, rateLimit } from "@/middleware/rate-limit";
import { jsonBody } from "@/shared/request-body";
import { serverEnv } from "@nowly/env/server";
import { Hono, type Context } from "hono";
import { REPORT_ATTACHMENTS_BODY_LIMIT, REPORT_KEY_HEADER, REPORT_KEY_MAX_LENGTH, REPORT_KEY_MIN_LENGTH, REPORT_MESSAGES_PER_WINDOW } from "./report.constants";
import { removeReportAttachments, storeReportAttachments } from "./report-attachments";
import { ReportError } from "./report-errors";
import { AssigneeSchema, CreateReportSchema, NotifySchema, ReporterMessageSchema, StaffMessageSchema, StaffQuerySchema, StatusSchema, UpdatesQuerySchema } from "./report.schemas";
import { assertReporterOwns, closeStaleReports, countStaffReports, createReport, deleteReport, getReporterReport, getStaffReport, hashReporterKey, listReporterReports, listStaffReports, postReporterMessage, postStaffMessage, reporterUpdates, setReporterClosed, setReporterNotify, setStaffAssignee, type Reporter } from "./report.service";

const REPORT_WINDOW_MS = 10 * MINUTE_MS;
const requireSchedulerSecret = requireSecret(() => serverEnv.CREATOR_WEBHOOK_SECRET, "CREATOR_WEBHOOK_SECRET_MISSING");

const reporterKeyOf = (c: Context): string | null => {
  const key = c.req.header(REPORT_KEY_HEADER)?.trim();

  if (!key || key.length < REPORT_KEY_MIN_LENGTH || key.length > REPORT_KEY_MAX_LENGTH) return null;

  return key;
};

const reporterOf = async (c: Context): Promise<Reporter | null> => {
  const key = reporterKeyOf(c);

  if (!key) return null;

  const account = await resolveAccount(c).catch(() => null);
  return {
    keyHash: hashReporterKey(key),
    userId: account?.userId ?? null
  };
};

const failure = (c: Context, error: unknown) => {
  if (error instanceof ReportError) return c.json({ error: error.code }, error.status);

  throw error;
};

const REPORTER_WRITE_LIMIT = rateLimit({
  name: "presence-report-messages",
  max: REPORT_MESSAGES_PER_WINDOW,
  windowMs: REPORT_WINDOW_MS,
  key: (c) => reporterKeyOf(c) ?? "anonymous"
});

const storeAttachments = async (c: Context, dataUrls: string[], guard?: () => Promise<void>): Promise<string[] | Response> => {
  if (dataUrls.length === 0) return [];

  try {
    await guard?.();
    return await storeReportAttachments(dataUrls);
  } catch (error) {
    return failure(c, error);
  }
};

const unauthorized = (c: Context) => c.json({ error: "REPORTER_KEY_REQUIRED" }, 401);

const invalid = (c: Context) => c.json({ error: "INVALID_REQUEST_BODY" }, 400);

export const presenceReportRoutes = new Hono<AppEnv>()
  .post("/presence-reports", REPORTER_WRITE_LIMIT, async (c) => {
    const reporter = await reporterOf(c);

    if (!reporter) return unauthorized(c);

    const body = CreateReportSchema.safeParse(await jsonBody(c));

    if (!body.success) return invalid(c);

    const context: Record<string, string> = {};

    if (body.data.locale) context.locale = body.data.locale;
    if (body.data.browser) context.browser = body.data.browser;
    if (body.data.browserVersion) context.browserVersion = body.data.browserVersion;
    if (body.data.extensionVersion) context.extensionVersion = body.data.extensionVersion;

    try {
      return c.json(
        await createReport({
          reporter,
          slug: body.data.slug,
          message: body.data.message,
          anonymous: body.data.anonymous,
          label: body.data.label ?? null,
          labelSource: body.data.labelSource ?? null,
          notify: body.data.notify,
          context
        }),
        201
      );
    } catch (error) {
      return failure(c, error);
    }
  })
  .get("/presence-reports", async (c) => {
    const reporter = await reporterOf(c);

    if (!reporter) return unauthorized(c);

    c.header("Cache-Control", "no-store");
    return c.json({ reports: await listReporterReports(reporter) });
  })
  .get("/presence-reports/updates", async (c) => {
    const reporter = await reporterOf(c);

    if (!reporter) return unauthorized(c);

    const query = UpdatesQuerySchema.safeParse({ since: c.req.query("since") });

    if (!query.success) return invalid(c);

    c.header("Cache-Control", "no-store");
    return c.json({ reports: await reporterUpdates(reporter, query.data.since) });
  })
  .post("/presence-reports/close-stale", requireSchedulerSecret, async (c) => c.json({ closed: await closeStaleReports() }))
  .get("/presence-reports/:id", async (c) => {
    const reporter = await reporterOf(c);

    if (!reporter) return unauthorized(c);

    try {
      c.header("Cache-Control", "no-store");
      return c.json(await getReporterReport(reporter, c.req.param("id")));
    } catch (error) {
      return failure(c, error);
    }
  })
  .post("/presence-reports/:id/messages", REPORTER_WRITE_LIMIT, limitBody(REPORT_ATTACHMENTS_BODY_LIMIT), async (c) => {
    const reporter = await reporterOf(c);

    if (!reporter) return unauthorized(c);

    const body = ReporterMessageSchema.safeParse(await jsonBody(c));

    if (!body.success) return invalid(c);

    const attachments = await storeAttachments(c, body.data.attachments, () => assertReporterOwns(reporter, c.req.param("id")));

    if (attachments instanceof Response) return attachments;

    try {
      return c.json({ messages: await postReporterMessage(reporter, c.req.param("id"), { ...body.data, attachments }) }, 201);
    } catch (error) {
      await removeReportAttachments(attachments).catch(() => undefined);
      return failure(c, error);
    }
  })
  .post("/presence-reports/:id/close", async (c) => {
    const reporter = await reporterOf(c);

    if (!reporter) return unauthorized(c);

    try {
      return c.json(await setReporterClosed(reporter, c.req.param("id"), true));
    } catch (error) {
      return failure(c, error);
    }
  })
  .post("/presence-reports/:id/reopen", async (c) => {
    const reporter = await reporterOf(c);

    if (!reporter) return unauthorized(c);

    try {
      return c.json(await setReporterClosed(reporter, c.req.param("id"), false));
    } catch (error) {
      return failure(c, error);
    }
  })
  .put("/presence-reports/:id/notify", async (c) => {
    const reporter = await reporterOf(c);

    if (!reporter) return unauthorized(c);

    const body = NotifySchema.safeParse(await jsonBody(c));

    if (!body.success) return invalid(c);

    try {
      await setReporterNotify(reporter, c.req.param("id"), body.data.notify);
      return c.json({ ok: true });
    } catch (error) {
      return failure(c, error);
    }
  })
  .get("/admin/presence-reports", requireCapability("review"), async (c) => {
    const query = StaffQuerySchema.safeParse({
      status: c.req.query("status"),
      mine: c.req.query("mine"),
      before: c.req.query("before")
    });

    if (!query.success) return invalid(c);

    c.header("Cache-Control", "no-store");
    return c.json({
      reports: await listStaffReports({
        status: query.data.status,
        assigneeId: query.data.mine ? c.get("account").userId : undefined,
        before: query.data.before
      }),
      counts: await countStaffReports()
    });
  })
  .get("/admin/presence-reports/:id", requireCapability("review"), async (c) => {
    try {
      c.header("Cache-Control", "no-store");
      return c.json(await getStaffReport(c.req.param("id")));
    } catch (error) {
      return failure(c, error);
    }
  })
  .post("/admin/presence-reports/:id/messages", requireCapability("review"), limitBody(REPORT_ATTACHMENTS_BODY_LIMIT), async (c) => {
    const body = StaffMessageSchema.safeParse(await jsonBody(c));
    const actor = c.get("actor");

    if (!body.success || actor.kind !== "user") return invalid(c);

    const attachments = await storeAttachments(c, body.data.attachments);

    if (attachments instanceof Response) return attachments;

    try {
      return c.json({ messages: await postStaffMessage(actor, c.req.param("id"), { ...body.data, attachments }) }, 201);
    } catch (error) {
      await removeReportAttachments(attachments).catch(() => undefined);
      return failure(c, error);
    }
  })
  .put("/admin/presence-reports/:id/status", requireCapability("review"), async (c) => {
    const body = StatusSchema.safeParse(await jsonBody(c));
    const actor = c.get("actor");

    if (!body.success || actor.kind !== "user") return invalid(c);

    try {
      return c.json({
        messages: await postStaffMessage(actor, c.req.param("id"), {
          message: "",
          visibility: "public",
          statusTo: body.data.status
        })
      });
    } catch (error) {
      return failure(c, error);
    }
  })
  .put("/admin/presence-reports/:id/assignee", requireCapability("review"), async (c) => {
    const body = AssigneeSchema.safeParse(await jsonBody(c));

    if (!body.success) return invalid(c);

    try {
      await setStaffAssignee(c.get("actor"), c.req.param("id"), body.data.assigneeId);
      return c.json({ ok: true });
    } catch (error) {
      return failure(c, error);
    }
  })
  .delete("/admin/presence-reports/:id", requireCapability("manage"), async (c) => {
    try {
      await deleteReport(c.get("actor"), c.req.param("id"));
      return c.json({ ok: true });
    } catch (error) {
      return failure(c, error);
    }
  });