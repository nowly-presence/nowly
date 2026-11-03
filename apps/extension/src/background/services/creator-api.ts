import { getEffectiveApiUrl } from "@/background/services/api-state";
import { getAccount } from "@/background/storage/account.store";
import { parseSubmission, type CreatorAccount, type CreatorSubmissionPayload, type CreatorSubmitResult } from "@nowly/presence-creator/creator-submission";
import type { CreatorSubmission } from "@nowly/presence-creator/creator-types";
import type { StoredAccount } from "@/shared/types";

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_UNPROCESSABLE = 422;

const isCreatorAccount = (account: StoredAccount | null): account is StoredAccount => Boolean(account?.scopes.includes("creator") && account.user.discordId);

export const getCreatorAccount = async (): Promise<CreatorAccount | null> => {
  const account = await getAccount();
  return account ? { user: account.user, creator: isCreatorAccount(account) } : null;
};

const errorMessage = (body: unknown): string | undefined =>
  body &&
  typeof body === "object" &&
  typeof (
    body as {
      message?: unknown;
    }
  ).message === "string"
    ? (
        body as {
          message: string;
        }
      ).message
    : undefined;

export const submitPresence = async (payload: CreatorSubmissionPayload): Promise<CreatorSubmitResult> => {
  const account = await getAccount();

  if (!account) return {
    ok: false,
    error: "UNAUTHORIZED"
  };
  if (!isCreatorAccount(account)) return {
    ok: false,
    error: "CREATOR_REQUIRED"
  };

  try {
    const response = await fetch(`${getEffectiveApiUrl()}/me/presence-submissions`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${account.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.status === HTTP_UNAUTHORIZED || response.status === HTTP_FORBIDDEN) return {
      ok: false,
      error: "CREATOR_REQUIRED"
    };
    if (response.status === HTTP_NOT_FOUND) return {
      ok: false,
      error: "UNAVAILABLE"
    };

    const body: unknown = await response.json().catch(() => null);

    if (response.status === HTTP_UNPROCESSABLE) return {
      ok: false,
      error: "INVALID",
      message: errorMessage(body)
    };

    const submission = response.ok ? parseSubmission(body) : null;
    return submission ? { ok: true, submission } : { ok: false, error: "UNAVAILABLE" };
  } catch {
    return {
      ok: false,
      error: "NETWORK"
    };
  }
};

export const fetchSubmissions = async (ids: string[]): Promise<CreatorSubmission[]> => {
  const account = await getAccount();

  if (!isCreatorAccount(account) || ids.length === 0) return [];

  try {
    const response = await fetch(`${getEffectiveApiUrl()}/me/presence-submissions?ids=${ids.map(encodeURIComponent).join(",")}`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${account.token}` }
    });

    if (!response.ok) return [];

    const body: unknown = await response.json();
    return Array.isArray(body) ? body.flatMap((entry) => parseSubmission(entry) ?? []) : [];
  } catch {
    return [];
  }
};