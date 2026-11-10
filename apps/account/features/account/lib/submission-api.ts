import { apiFetch as request, isRecord } from "@/lib/api-client";
import type { QueueFilter, ReviewVerdict } from "@nowly/presence-creator/creator-submission-policy";
import type { SubmissionStatus } from "@nowly/presence-creator/creator-types";

export type { QueueFilter, ReviewVerdict, SubmissionStatus };

export type LocalizedText = Partial<Record<string, string>>;

export type SubmissionPage = {
  id: string;
  name: string;
  match: {
    mode: string;
    path: string;
  };
  activityType: string;
  details: LocalizedText;
  state: LocalizedText;
  timestamps: string;
  buttons?: Array<{
    label: LocalizedText;
  }>;
  button?: {
    enabled: boolean;
    label: LocalizedText;
  };
};

export type SubmissionDefinition = {
  name: string;
  domains: string[];
  color: string;
  category: string;
  baseLocale: string;
  translationMode: string;
  locales: string[];
  description: LocalizedText;
  longDescription: LocalizedText;
  features: LocalizedText[];
  pages: SubmissionPage[];
  author: {
    name: string;
    github?: string;
    discord?: string;
  };
};

export type SubmissionFieldChange = {
  field: string;
  page?: string;
  kind: "added" | "removed" | "changed";
};

export type SubmissionPerson = {
  id: string;
  name: string | null;
} | null;

export type SubmissionListItem = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  status: SubmissionStatus;
  revision: number;
  updatedAt: string;
  prUrl?: string;
};

export type QueueItem = SubmissionListItem & {
  author: SubmissionPerson;
};

export type FieldComment = {
  field: string;
  page?: string;
  message: string;
};

export type SubmissionReview = {
  id: string;
  revision: number;
  reviewer: SubmissionPerson;
  verdict: ReviewVerdict;
  message: string;
  comments: FieldComment[];
  createdAt: string;
};

export type SubmissionRevisionSummary = {
  number: number;
  author: SubmissionPerson;
  changes: SubmissionFieldChange[];
  createdAt: string;
};

export type SubmissionHistoryEntry = {
  type: string;
  status: string | null;
  revision: number | null;
  actor: SubmissionPerson;
  note: string | null;
  createdAt: string;
};

export type SubmissionFile = {
  path: string;
  content: string;
};

export type SubmissionAssets = Partial<Record<"thumbnail" | "logo" | "icon", string>>;

export type SubmissionDetail = SubmissionListItem & {
  note?: string;
  baseRevision: number | null;
  translate: boolean;
  author: SubmissionPerson;
  createdAt: string;
  definition: SubmissionDefinition | null;
  files: SubmissionFile[];
  assets: SubmissionAssets;
  pullRequest: {
    number: number | null;
    url: string | null;
    revision: number | null;
    error: string | null;
  };
  revisions: SubmissionRevisionSummary[];
  reviews: SubmissionReview[];
  history: SubmissionHistoryEntry[];
};

export class SubmissionRequestError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(status: number, code: string | null) {
    super(code ?? `HTTP_${status}`);
    this.status = status;
    this.code = code;
  }
}

const readJson = async <T>(response: Response): Promise<T> => {
  if (response.ok) return (await response.json()) as T;

  const body: unknown = await response.json().catch(() => null);

  const code = isRecord(body) && typeof body.error === "string" ? body.error : null;
  throw new SubmissionRequestError(response.status, code);
};

export const fetchCreations = async (): Promise<SubmissionListItem[]> =>
  (
    await readJson<{
      items: SubmissionListItem[];
    }>(await request("/me/creations"))
  ).items;

export type ReviewQueue = {
  items: QueueItem[];
  counts: Record<QueueFilter, number>;
};

export const fetchReviewQueue = async (status: QueueFilter = "pending"): Promise<ReviewQueue> =>
  readJson<ReviewQueue>(await request(`/presence-submissions/queue?status=${status}`));

export const fetchSubmission = async (id: string): Promise<SubmissionDetail> =>
  readJson<SubmissionDetail>(await request(`/presence-submissions/${encodeURIComponent(id)}`));

export const sendReview = async (id: string, review: {
  revision: number;
  verdict: ReviewVerdict;
  message: string;
  comments: FieldComment[];
}): Promise<void> => {
  await readJson<unknown>(
    await request(`/presence-submissions/${encodeURIComponent(id)}/reviews`, {
      method: "POST",
      body: JSON.stringify(review)
    })
  );
};

export const publishSubmission = async (id: string, revision: number): Promise<void> => {
  await readJson<unknown>(
    await request(`/presence-submissions/${encodeURIComponent(id)}/publish`, {
      method: "POST",
      body: JSON.stringify({ revision })
    })
  );
};