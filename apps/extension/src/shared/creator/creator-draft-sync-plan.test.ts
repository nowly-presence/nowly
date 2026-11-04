import { describe, expect, it } from "vitest";
import { planDraftSync } from "@/shared/creator/creator-draft-sync-plan";

const remote = (id: string, updatedAt: number, deleted = false) => ({ id, updatedAt, deleted });

describe("planDraftSync", () => {
  it("pulls drafts that only exist remotely or are newer there", () => {
    expect(planDraftSync({}, {}, [remote("a", 5)])).toEqual([
      {
        kind: "pull",
        id: "a"
      }
    ]);
    expect(
      planDraftSync(
        {
          a: { updatedAt: 3 }
        },
        {},
        [remote("a", 5)]
      )
    ).toEqual([
      {
        kind: "pull",
        id: "a"
      }
    ]);
  });

  it("pushes drafts that are new or newer locally", () => {
    expect(
      planDraftSync(
        {
          a: { updatedAt: 5 }
        },
        {},
        []
      )
    ).toEqual([
      {
        kind: "push",
        id: "a"
      }
    ]);
    expect(
      planDraftSync(
        {
          a: { updatedAt: 5 }
        },
        {},
        [remote("a", 3)]
      )
    ).toEqual([
      {
        kind: "push",
        id: "a"
      }
    ]);
  });

  it("does nothing when both sides agree", () => {
    expect(
      planDraftSync(
        {
          a: { updatedAt: 5 }
        },
        {},
        [remote("a", 5)]
      )
    ).toEqual([]);
  });

  it("propagates deletions in both directions", () => {
    expect(
      planDraftSync(
        {
          a: { updatedAt: 3 }
        },
        {},
        [remote("a", 5, true)]
      )
    ).toEqual([
      {
        kind: "removeLocal",
        id: "a"
      }
    ]);
    expect(planDraftSync({}, { a: 9 }, [remote("a", 5)])).toEqual([
      {
        kind: "deleteRemote",
        id: "a"
      }
    ]);
  });

  it("clears settled or irrelevant tombstones", () => {
    expect(planDraftSync({}, { a: 9 }, [])).toEqual([
      {
        kind: "clearTombstone",
        id: "a"
      }
    ]);
    expect(planDraftSync({}, { a: 5 }, [remote("a", 5, true)])).toEqual([
      {
        kind: "clearTombstone",
        id: "a"
      }
    ]);
  });

  it("lets a later edit win over an older deletion", () => {
    expect(
      planDraftSync(
        {
          a: { updatedAt: 9 }
        },
        { a: 5 },
        [remote("a", 5, true)]
      )
    ).toEqual([
      {
        kind: "clearTombstone",
        id: "a"
      },
      {
        kind: "push",
        id: "a"
      }
    ]);
  });
});