import type { presenceSubmission } from "@nowly/database/schema/creator";

export type SubmissionSummary = {
  id: string;
  status: string;
  revision: number;
  updatedAt: string;
  prUrl?: string;
  note?: string;
};

export const toSummary = (row: typeof presenceSubmission.$inferSelect): SubmissionSummary => ({
  id: row.id,
  status: row.status,
  revision: row.revision,
  updatedAt: row.updatedAt.toISOString(),
  ...(row.prUrl ? { prUrl: row.prUrl } : {}),
  ...(row.note ? { note: row.note } : {})
});