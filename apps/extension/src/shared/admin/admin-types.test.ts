import { describe, expect, it } from "vitest";
import { parseQueue, parseSubmissionDetail } from "@/shared/admin/admin-types";

describe("admin payload parsing", () => {
  it("keeps valid queue rows and drops unknown statuses", () => {
    const queue = parseQueue({
      items: [
        {
          id: "a",
          slug: "tube",
          kind: "update",
          status: "submitted",
          revision: 2,
          updatedAt: "2026-11-03T10:00:00.000Z",
          author: {
            id: "u",
            name: "Ana"
          }
        },
        {
          id: "b",
          slug: "bad",
          status: "nope"
        }
      ]
    });
    expect(queue).toHaveLength(1);
    expect(queue?.[0]).toMatchObject({
      id: "a",
      kind: "update",
      revision: 2,
      author: { name: "Ana" }
    });
    expect(parseQueue({})).toBeNull();
  });

  it("parses reviews with field comments and the withoutReview event flag", () => {
    const detail = parseSubmissionDetail({
      id: "s1",
      slug: "tube",
      status: "changes_requested",
      revision: 2,
      definition: null,
      assets: { logo: "https://cdn/logo.png" },
      pullRequest: {
        url: "https://github.com/x/y/pull/1",
        error: null
      },
      reviews: [
        {
          id: "r1",
          revision: 1,
          verdict: "request_changes",
          message: "Fix",
          comments: [
            {
              field: "page.details",
              page: "Watch",
              message: "Too long"
            },
            { nope: true }
          ],
          createdAt: "2026-11-03T10:00:00.000Z"
        }
      ],
      history: [
        {
          type: "publish",
          details: { withoutReview: true },
          createdAt: "2026-11-03T11:00:00.000Z"
        }
      ],
      revisions: [
        {
          number: 2,
          changes: [
            {
              field: "name",
              kind: "changed"
            },
            { field: 1 }
          ],
          createdAt: "2026-11-03T10:30:00.000Z"
        }
      ]
    });
    expect(detail?.reviews[0].comments).toEqual([
      {
        field: "page.details",
        page: "Watch",
        message: "Too long"
      }
    ]);
    expect(detail?.history[0].withoutReview).toBe(true);
    expect(detail?.revisions[0].changes).toEqual([
      {
        field: "name",
        kind: "changed"
      }
    ]);
    expect(detail?.prUrl).toBe("https://github.com/x/y/pull/1");
    expect(
      parseSubmissionDetail({
        id: "s",
        slug: "x",
        status: "unknown"
      })
    ).toBeNull();
  });
});