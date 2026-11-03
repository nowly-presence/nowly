import type { AppEnv } from "@/context";
import { accountOf, requireExtensionToken, resolveAccount } from "@/features/account/extension-token.middleware";
import { requireCapability } from "@/features/admin/admin.middleware";
import { getUserRole } from "@/features/admin/roles.service";
import { requireSecret } from "@/features/auth/auth.middleware";
import { limitBody } from "@/middleware/body-limit";
import { HOUR_MS, rateLimit } from "@/middleware/rate-limit";
import { jsonBody } from "@/shared/request-body";
import { serverEnv } from "@nowly/env/server";
import { hasCapability } from "@nowly/shared/roles";
import { Hono, type Context } from "hono";
import { SubmissionError } from "./submission-errors";
import { getSubmissionAuthorId, getSubmissionDetail, listReviewQueue } from "./submission-detail.service";
import { markSubmissionPublished, publishSubmission, reviewSubmission } from "./submission-review.service";
import { PublishBodySchema, PublishedWebhookSchema, ReviewBodySchema, SubmitBodySchema, SUBMISSION_BODY_LIMIT, SUBMISSIONS_PER_HOUR, SubmissionIdsSchema } from "./submission.schemas";
import { listOwnSubmissions, submitPresence } from "./submission.service";

const SUBMIT_RATE_LIMIT = rateLimit({
  name: "presence-submissions",
  max: SUBMISSIONS_PER_HOUR,
  windowMs: HOUR_MS,
  key: (c: Context<AppEnv>) => accountOf(c).userId
});
const requireWebhookSecret = requireSecret(() => serverEnv.CREATOR_WEBHOOK_SECRET, "CREATOR_WEBHOOK_SECRET_MISSING");

const failure = (c: Context, error: unknown) => {
  if (error instanceof SubmissionError) return c.json(
    {
      error: error.code,
      message: error.detail
    },
    error.status
  );

  throw error;
};

const canRead = async (c: Context, submissionId: string): Promise<"ok" | 401 | 404> => {
  const account = await resolveAccount(c);

  if (!account) return 401;

  const authorId = await getSubmissionAuthorId(submissionId);

  if (!authorId) return 404;
  if (authorId === account.userId) return "ok";
  if (account.tokenId && !account.scopes.includes("admin")) return 404;

  return hasCapability(await getUserRole(account.userId), "review") ? "ok" : 404;
};

export const presenceSubmissionRoutes = new Hono<AppEnv>()
  .post("/me/presence-submissions", requireExtensionToken("creator"), SUBMIT_RATE_LIMIT, limitBody(SUBMISSION_BODY_LIMIT), async (c) => {
    const body = SubmitBodySchema.safeParse(await jsonBody(c));

    if (!body.success) return c.json(
      {
        error: "INVALID_DEFINITION",
        message: "The submission is malformed."
      },
      422
    );

    try {
      return c.json(
        await submitPresence({
          userId: accountOf(c).userId,
          definition: body.data.definition,
          translate: body.data.translate,
          assets: body.data.assets
        }),
        201
      );
    } catch (error) {
      return failure(c, error);
    }
  })
  .get("/me/presence-submissions", requireExtensionToken("creator"), async (c) => {
    const ids = SubmissionIdsSchema.safeParse(c.req.query("ids") ?? "");

    if (!ids.success) return c.json({ error: "INVALID_QUERY" }, 400);

    return c.json(await listOwnSubmissions(accountOf(c).userId, ids.data));
  })
  .get("/presence-submissions/queue", requireCapability("review"), async (c) => {
    c.header("Cache-Control", "no-store");
    return c.json({ items: await listReviewQueue() });
  })
  .post("/presence-submissions/published", requireWebhookSecret, async (c) => {
    const body = PublishedWebhookSchema.safeParse(await jsonBody(c));

    if (!body.success) return c.json({ error: "INVALID_REQUEST_BODY" }, 400);

    try {
      return c.json(
        await markSubmissionPublished({
          ...body.data,
          actor: { kind: "secret" }
        })
      );
    } catch (error) {
      return failure(c, error);
    }
  })
  .get("/presence-submissions/:id", async (c) => {
    const id = c.req.param("id");
    const access = await canRead(c, id);

    if (access === 401) return c.json({ error: "UNAUTHORIZED" }, 401);
    if (access === 404) return c.json({ error: "SUBMISSION_NOT_FOUND" }, 404);

    c.header("Cache-Control", "no-store");
    return c.json(await getSubmissionDetail(id));
  })
  .post("/presence-submissions/:id/reviews", requireCapability("review"), async (c) => {
    const body = ReviewBodySchema.safeParse(await jsonBody(c));

    if (!body.success) return c.json({ error: "INVALID_REVIEW" }, 400);

    try {
      return c.json(
        await reviewSubmission({
          ...body.data,
          reviewerId: accountOf(c).userId,
          submissionId: c.req.param("id")
        })
      );
    } catch (error) {
      return failure(c, error);
    }
  })
  .post("/presence-submissions/:id/publish", requireCapability("publish"), async (c) => {
    const body = PublishBodySchema.safeParse(await jsonBody(c));

    if (!body.success) return c.json({ error: "INVALID_REQUEST_BODY" }, 400);

    try {
      return c.json(
        await publishSubmission({
          adminId: accountOf(c).userId,
          submissionId: c.req.param("id"),
          revision: body.data.revision
        })
      );
    } catch (error) {
      return failure(c, error);
    }
  });