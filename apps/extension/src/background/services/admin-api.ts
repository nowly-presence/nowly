import { getEffectiveApiUrl } from "@/background/services/api-state";
import { assetUrl } from "@/shared/presence-assets";
import { getAccount, updateAccountUser } from "@/background/storage/account.store";
import { parsePublishedCreatorPresence, parseQueue, parseStaffCapabilities, parseSubmissionDetail, type AdminError, type AdminResult, type AnnouncementDraft, type FieldComment, type QueueItem, type ReviewVerdict, type StaffAccess, type SubmissionDetail } from "@/shared/admin/admin-types";
import { parseSubmission } from "@nowly/presence-creator/creator-submission";
import { normalizeDraft } from "@nowly/presence-creator/creator-draft";
import type { CreatorDraft, CreatorSubmission } from "@nowly/presence-creator/creator-types";
import type { StoredAccount } from "@/shared/types";

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNPROCESSABLE = 422;
const BASE64_CHUNK = 0x8000;
const IMAGE_KINDS = ["thumbnail", "logo", "icon"] as const;

type Method = "GET" | "POST";

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const errorForStatus = (status: number): AdminError => {
  if (status === HTTP_UNAUTHORIZED) return "UNAUTHORIZED";
  if (status === HTTP_FORBIDDEN) return "FORBIDDEN";
  if (status === HTTP_NOT_FOUND) return "NOT_FOUND";
  if (status === HTTP_CONFLICT) return "CONFLICT";
  if (status === HTTP_BAD_REQUEST || status === HTTP_UNPROCESSABLE) return "INVALID";

  return "UNAVAILABLE";
};

const call = async <T>(account: StoredAccount, method: Method, path: string, parse: (body: unknown) => T | null, body?: unknown): Promise<AdminResult<T>> => {
  try {
    const response = await fetch(`${getEffectiveApiUrl()}${path}`, {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${account.token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" })
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) return {
      ok: false,
      error: errorForStatus(response.status),
      message: isRecord(payload) && typeof payload.message === "string" ? payload.message : undefined
    };

    const data = parse(payload);
    return data === null ? { ok: false, error: "UNAVAILABLE" } : { ok: true, data };
  } catch {
    return {
      ok: false,
      error: "NETWORK"
    };
  }
};

const withAccount = async <T>(run: (account: StoredAccount) => Promise<AdminResult<T>>): Promise<AdminResult<T>> => {
  const account = await getAccount();
  return account ? run(account) : { ok: false, error: "UNAUTHORIZED" };
};

const accept = (): true => true;

export const getStaffAccess = async (): Promise<StaffAccess | null> => {
  const account = await getAccount();

  if (!account) return null;

  const fresh = await call(account, "GET", "/me", parseStaffCapabilities);

  const capabilities = fresh.ok ? fresh.data : (account.user.capabilities ?? []);

  const changed = fresh.ok && capabilities.join() !== (account.user.capabilities ?? []).join();

  if (changed) await updateAccountUser({ ...account.user, capabilities }).catch(() => undefined);

  return { capabilities };
};

export const fetchReviewQueue = (): Promise<AdminResult<QueueItem[]>> =>
  withAccount((account) => call(account, "GET", "/presence-submissions/queue", parseQueue));

export const fetchSubmissionDetail = (id: string): Promise<AdminResult<SubmissionDetail>> =>
  withAccount((account) => call(account, "GET", `/presence-submissions/${encodeURIComponent(id)}`, parseSubmissionDetail));

export const sendReview = (input: {
  id: string;
  revision: number;
  verdict: ReviewVerdict;
  message: string;
  comments: FieldComment[];
}): Promise<AdminResult<CreatorSubmission>> =>
  withAccount((account) =>
    call(account, "POST", `/presence-submissions/${encodeURIComponent(input.id)}/reviews`, parseSubmission, {
      revision: input.revision,
      verdict: input.verdict,
      message: input.message,
      comments: input.comments
    })
  );

export const publishSubmission = (id: string, revision: number): Promise<AdminResult<CreatorSubmission>> =>
  withAccount((account) => call(account, "POST", `/presence-submissions/${encodeURIComponent(id)}/publish`, parseSubmission, { revision }));

export const retryPullRequest = (id: string): Promise<AdminResult<true>> =>
  withAccount((account) => call(account, "POST", `/presence-submissions/${encodeURIComponent(id)}/pull-request`, accept, {}));

export const createAnnouncement = (input: AnnouncementDraft): Promise<AdminResult<true>> =>
  withAccount((account) => call(account, "POST", "/announcements", accept, input));

const toBase64 = (bytes: Uint8Array): string => {
  let binary = "";

  for (let index = 0; index < bytes.length; index += BASE64_CHUNK) binary += String.fromCharCode(...bytes.subarray(index, index + BASE64_CHUNK));

  return btoa(binary);
};

const fetchImage = async (slug: string, kind: (typeof IMAGE_KINDS)[number]): Promise<string | undefined> => {
  try {
    const response = await fetch(assetUrl(slug, kind), { cache: "no-store" });

    if (!response.ok) return undefined;

    const type = response.headers.get("Content-Type")?.split(";")[0] || (kind === "thumbnail" ? "image/jpeg" : "image/png");
    return `data:${type};base64,${toBase64(new Uint8Array(await response.arrayBuffer()))}`;
  } catch {
    return undefined;
  }
};

export const probeCreatorPresence = (slug: string): Promise<AdminResult<number>> =>
  withAccount((account) =>
    call(account, "GET", `/creator-presences/${encodeURIComponent(slug)}`, (body) => parsePublishedCreatorPresence(body)?.revision ?? null)
  );

export const loadCreatorPresenceDraft = (slug: string): Promise<AdminResult<CreatorDraft>> =>
  withAccount(async (account) => {
    const published = await call(account, "GET", `/creator-presences/${encodeURIComponent(slug)}`, parsePublishedCreatorPresence);

    if (!published.ok) return published;

    const [thumbnail, logo, icon] = await Promise.all(IMAGE_KINDS.map((kind) => fetchImage(slug, kind)));

    if (!thumbnail || !logo || !icon) return {
      ok: false,
      error: "UNAVAILABLE"
    };

    const now = Date.now();
    return {
      ok: true,
      data: normalizeDraft({
        ...published.data.definition,
        createdAt: now,
        updatedAt: now,
        step: "review",
        assets: {
          thumbnail,
          logo,
          icon,
          iconTransparent: true,
          thumbnailRightsConfirmed: true
        }
      })
    };
  });