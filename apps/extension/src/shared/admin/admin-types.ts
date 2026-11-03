import { ADMIN_CAPABILITIES, type AdminCapability } from "@nowly/shared/roles";
import { parseCreatorDefinition, type CreatorDefinition } from "@nowly/presence-creator/creator-schema";
import { isSubmissionStatus } from "@nowly/presence-creator/creator-submission";
import type { CreatorFieldChange } from "@nowly/presence-creator/creator-diff";
import type { SubmissionStatus } from "@nowly/presence-creator/creator-types";
import type { AnnouncementInput } from "@nowly/shared/announcements";

export const REVIEW_VERDICTS = ["approve", "comment", "request_changes", "reject"] as const;

export type ReviewVerdict = (typeof REVIEW_VERDICTS)[number];

export type StaffAccess = {
  capabilities: AdminCapability[];
};

export type AdminError = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INVALID" | "UNAVAILABLE" | "NETWORK";

export type AdminResult<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
  error: AdminError;
  message?: string;
};

export type SubmissionPerson = {
  id: string;
  name: string | null;
};

export type QueueItem = {
  id: string;
  slug: string;
  kind: "create" | "update";
  status: SubmissionStatus;
  revision: number;
  updatedAt: number;
  author: SubmissionPerson | null;
  prUrl?: string;
};

export type FieldComment = {
  field: string;
  page?: string;
  message: string;
};

export type SubmissionReview = {
  id: string;
  revision: number;
  reviewer: SubmissionPerson | null;
  verdict: ReviewVerdict;
  message: string;
  comments: FieldComment[];
  createdAt: number;
};

export type SubmissionEvent = {
  type: string;
  revision: number | null;
  actor: SubmissionPerson | null;
  note: string | null;
  createdAt: number;
  withoutReview: boolean;
};

export type SubmissionRevision = {
  number: number;
  changes: CreatorFieldChange[];
  createdAt: number;
};

export type SubmissionDetail = {
  id: string;
  slug: string;
  kind: "create" | "update";
  status: SubmissionStatus;
  revision: number;
  author: SubmissionPerson | null;
  definition: CreatorDefinition | null;
  assets: Partial<Record<"logo" | "icon" | "thumbnail", string>>;
  note?: string;
  prUrl?: string;
  prError?: string;
  revisions: SubmissionRevision[];
  reviews: SubmissionReview[];
  history: SubmissionEvent[];
};

export type PublishedCreatorPresence = {
  slug: string;
  revision: number;
  definition: CreatorDefinition;
};

export type AnnouncementDraft = AnnouncementInput & {
  translate: boolean;
};


export const isAdminCapability = (value: unknown): value is AdminCapability => (ADMIN_CAPABILITIES as readonly unknown[]).includes(value);

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const text = (value: unknown): string | undefined => (typeof value === "string" && value ? value : undefined);

const time = (value: unknown): number => (typeof value === "string" ? Date.parse(value) || 0 : 0);

const isVerdict = (value: unknown): value is ReviewVerdict => typeof value === "string" && (REVIEW_VERDICTS as readonly string[]).includes(value);

const person = (value: unknown): SubmissionPerson | null => {
  if (!isRecord(value) || typeof value.id !== "string") return null;

  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : null
  };
};

const kind = (value: unknown): "create" | "update" => (value === "update" ? "update" : "create");

export const parseQueue = (body: unknown): QueueItem[] | null => {
  if (!isRecord(body) || !Array.isArray(body.items)) return null;

  return body.items.flatMap((entry): QueueItem[] => {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.slug !== "string" || !isSubmissionStatus(entry.status)) return [];

    return [
      {
        id: entry.id,
        slug: entry.slug,
        kind: kind(entry.kind),
        status: entry.status,
        revision: typeof entry.revision === "number" ? entry.revision : 1,
        updatedAt: time(entry.updatedAt),
        author: person(entry.author),
        prUrl: text(entry.prUrl)
      }
    ];
  });
};

const parseComments = (value: unknown): FieldComment[] =>
  Array.isArray(value)
    ? value.flatMap((entry): FieldComment[] =>
        isRecord(entry) && typeof entry.field === "string" && typeof entry.message === "string"
          ? [
              {
                field: entry.field,
                page: text(entry.page),
                message: entry.message
              }
            ]
          : []
      )
    : [];

const parseChanges = (value: unknown): CreatorFieldChange[] =>
  Array.isArray(value)
    ? value.flatMap((entry): CreatorFieldChange[] =>
        isRecord(entry) && typeof entry.field === "string" && (entry.kind === "added" || entry.kind === "removed" || entry.kind === "changed")
          ? [
              {
                field: entry.field,
                page: text(entry.page),
                kind: entry.kind
              }
            ]
          : []
      )
    : [];

const parseAssets = (value: unknown): SubmissionDetail["assets"] => {
  if (!isRecord(value)) return {};

  return {
    logo: text(value.logo),
    icon: text(value.icon),
    thumbnail: text(value.thumbnail)
  };
};

export const parseSubmissionDetail = (body: unknown): SubmissionDetail | null => {
  if (!isRecord(body) || typeof body.id !== "string" || typeof body.slug !== "string" || !isSubmissionStatus(body.status)) return null;

  const pullRequest = isRecord(body.pullRequest) ? body.pullRequest : {};
  return {
    id: body.id,
    slug: body.slug,
    kind: kind(body.kind),
    status: body.status,
    revision: typeof body.revision === "number" ? body.revision : 1,
    author: person(body.author),
    definition: parseCreatorDefinition(body.definition),
    assets: parseAssets(body.assets),
    note: text(body.note),
    prUrl: text(body.prUrl) ?? text(pullRequest.url),
    prError: text(pullRequest.error),
    revisions: Array.isArray(body.revisions)
      ? body.revisions.flatMap((entry): SubmissionRevision[] =>
          isRecord(entry) && typeof entry.number === "number"
            ? [
                {
                  number: entry.number,
                  changes: parseChanges(entry.changes),
                  createdAt: time(entry.createdAt)
                }
              ]
            : []
        )
      : [],
    reviews: Array.isArray(body.reviews)
      ? body.reviews.flatMap((entry): SubmissionReview[] =>
          isRecord(entry) && typeof entry.id === "string" && isVerdict(entry.verdict)
            ? [
                {
                  id: entry.id,
                  revision: typeof entry.revision === "number" ? entry.revision : 1,
                  reviewer: person(entry.reviewer),
                  verdict: entry.verdict,
                  message: typeof entry.message === "string" ? entry.message : "",
                  comments: parseComments(entry.comments),
                  createdAt: time(entry.createdAt)
                }
              ]
            : []
        )
      : [],
    history: Array.isArray(body.history)
      ? body.history.flatMap((entry): SubmissionEvent[] =>
          isRecord(entry) && typeof entry.type === "string"
            ? [
                {
                  type: entry.type,
                  revision: typeof entry.revision === "number" ? entry.revision : null,
                  actor: person(entry.actor),
                  note: typeof entry.note === "string" ? entry.note : null,
                  createdAt: time(entry.createdAt),
                  withoutReview: isRecord(entry.details) && entry.details.withoutReview === true
                }
              ]
            : []
        )
      : []
  };
};

export const parsePublishedCreatorPresence = (body: unknown): PublishedCreatorPresence | null => {
  if (!isRecord(body) || typeof body.slug !== "string" || typeof body.revision !== "number") return null;

  const definition = parseCreatorDefinition(body.definition);
  return definition ? { slug: body.slug, revision: body.revision, definition } : null;
};

export const parseStaffCapabilities = (body: unknown): AdminCapability[] | null =>
  isRecord(body) && Array.isArray(body.capabilities) ? body.capabilities.filter(isAdminCapability) : null;