import { describe, expect, it } from "vitest";
import { announcementIssues, buildAnnouncementInput, emptyAnnouncementForm } from "@/shared/admin/announcement-draft";
import { AnnouncementInputSchema } from "@nowly/shared/announcements";

const filled = {
  title: "Maintenance tonight",
  description: "Short downtime",
  content: ""
};

describe("announcement draft", () => {
  it("needs a complete English text", () => {
    expect(announcementIssues(emptyAnnouncementForm())).toEqual(["TEXTS_MISSING"]);
    expect(
      announcementIssues({
        ...emptyAnnouncementForm(),
        texts: {
          ...filled,
          description: ""
        }
      })
    ).toEqual(["TEXTS_MISSING"]);
  });

  it("flags a start after the expiry", () => {
    const form = {
      ...emptyAnnouncementForm(),
      texts: filled,
      startsAt: "2026-11-05T10:00",
      expiresAt: "2026-11-04T10:00"
    };
    expect(announcementIssues(form)).toEqual(["DATES_ORDER"]);
  });

  it("builds an English only input the API schema accepts, with severity only for warnings and the translation flag", () => {
    const form = {
      ...emptyAnnouncementForm(),
      texts: filled,
      severity: 3 as const,
      pinned: true
    };
    const input = buildAnnouncementInput(form);

    expect(Object.keys(input.translations)).toEqual(["en"]);
    expect(input.severity).toBeNull();
    expect(
      buildAnnouncementInput({
        ...form,
        translate: false
      }).translate
    ).toBe(false);
    const { translate, ...announcement } = input;
    expect(translate).toBe(true);
    expect(AnnouncementInputSchema.safeParse(announcement).success).toBe(true);

    const { translate: warningFlag, ...warning } = buildAnnouncementInput({
      ...form,
      kind: "warning"
    });
    expect(warningFlag).toBe(true);
    expect(warning.severity).toBe(3);
    expect(AnnouncementInputSchema.safeParse(warning).success).toBe(true);
  });
});