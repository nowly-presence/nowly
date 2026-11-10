import { describe, expect, it } from "vitest";
import { allowedVerdicts, canPublishSubmission, reviewIsValid } from "./creator-submission-policy";

describe("submission review policy", () => {
  it("only offers the verdicts accepted for a status", () => {
    expect(allowedVerdicts("submitted")).toEqual(["approve", "comment", "request_changes", "reject"]);
    expect(allowedVerdicts("approved")).toEqual(["comment", "request_changes", "reject"]);
    expect(allowedVerdicts("changes_requested")).toEqual(["comment"]);
    expect(allowedVerdicts("published")).toEqual([]);
  });

  it("publishes from submitted or approved only", () => {
    expect(canPublishSubmission("submitted")).toBe(true);
    expect(canPublishSubmission("approved")).toBe(true);
    expect(canPublishSubmission("in_progress")).toBe(false);
  });

  it("requires a message to reject or request changes, and a message or field comment to comment", () => {
    expect(reviewIsValid("approve", "", 0)).toBe(true);
    expect(reviewIsValid("reject", "  ", 2)).toBe(false);
    expect(reviewIsValid("request_changes", "Fix the colour", 0)).toBe(true);
    expect(reviewIsValid("comment", "", 0)).toBe(false);
    expect(reviewIsValid("comment", "", 1)).toBe(true);
  });
});