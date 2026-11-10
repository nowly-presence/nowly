import type { AdminResult, QueueItem, SubmissionDetail } from "@/shared/admin/admin-types";
import { previewParams } from "@/preview/preview-params";
import type { MockHandlers } from "@/preview/mock-handlers";
import { creatorDefinition } from "@nowly/presence-creator/creator-export";
import { sampleCreatorDraft } from "@nowly/presence-creator/creator-fixtures";
import { ADMIN_CAPABILITIES, ROLE_CAPABILITIES } from "@nowly/shared/roles";

const DAY_MS = 86_400_000;
const PREVIEW_SUBMISSION_ID = "0123456789abcdef01234567";

const PREVIEW_IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#0891b2"/></svg>')}`;

const ok = <T>(data: T): AdminResult<T> => ({
  ok: true,
  data
});

const previewQueue = (): QueueItem[] => [
  {
    id: PREVIEW_SUBMISSION_ID,
    slug: "example-tube",
    kind: "update",
    status: "submitted",
    revision: 2,
    updatedAt: Date.now() - DAY_MS,
    author: {
      id: "author",
      name: "Nolo Fan"
    }
  }
];

const previewDetail = (): SubmissionDetail => {
  const definition = creatorDefinition(sampleCreatorDraft());
  return {
    id: PREVIEW_SUBMISSION_ID,
    slug: "example-tube",
    kind: "update",
    status: "submitted",
    revision: 2,
    author: {
      id: "author",
      name: "Nolo Fan"
    },
    definition,
    assets: {},
    revisions: [
      {
        number: 2,
        changes: [
          {
            field: "description",
            kind: "changed"
          },
          {
            field: "page.details",
            page: definition.pages[0]?.name,
            kind: "changed"
          }
        ],
        createdAt: Date.now() - DAY_MS
      }
    ],
    reviews: [
      {
        id: "review-1",
        revision: 1,
        reviewer: {
          id: "mod",
          name: "Moderator"
        },
        verdict: "request_changes",
        message: "A couple of texts are too long.",
        comments: [
          {
            field: "page.details",
            page: definition.pages[0]?.name,
            message: "Keep it under 40 characters."
          }
        ],
        createdAt: Date.now() - 2 * DAY_MS
      }
    ],
    history: []
  };
};

export const createMockAdminHandlers = (account: { signedIn: () => boolean }): MockHandlers => ({
  ADMIN_GET_ACCESS: () => {
    const { staff } = previewParams;

    if (!account.signedIn() || staff === "none") return null;

    return {
      capabilities: staff === "admin" ? [...ADMIN_CAPABILITIES] : [...ROLE_CAPABILITIES.moderator]
    };
  },
  ADMIN_FETCH_QUEUE: () => ok(previewQueue()),
  SUBMISSION_GET_DETAIL: () => ok(previewDetail()),
  ADMIN_REVIEW: () =>
    ok({
      id: PREVIEW_SUBMISSION_ID,
      status: "changes_requested",
      updatedAt: Date.now()
    }),
  ADMIN_PUBLISH: () =>
    ok({
      id: PREVIEW_SUBMISSION_ID,
      status: "in_progress",
      revision: 2,
      updatedAt: Date.now()
    }),
  ADMIN_RETRY_PULL_REQUEST: () => ok(true),
  ADMIN_CREATE_ANNOUNCEMENT: () => ok(true),
  ADMIN_PROBE_CREATOR_PRESENCE: () => ok(1),
  ADMIN_LOAD_CREATOR_PRESENCE: () => {
    const draft = sampleCreatorDraft();
    return ok({
      ...draft,
      step: "review",
      assets: {
        ...draft.assets,
        thumbnail: PREVIEW_IMAGE,
        logo: PREVIEW_IMAGE,
        icon: PREVIEW_IMAGE
      }
    });
  }
});