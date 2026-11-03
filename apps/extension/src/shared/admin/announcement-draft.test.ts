import { describe, expect, it } from "vitest";
import { announcementIssues, buildAnnouncementInput, emptyAnnouncementForm } from "@/shared/admin/announcement-draft";
import { AnnouncementInputSchema } from "@nowly/shared/announcements";

const filled = {
  title: "Maintenance tonight",
  description: "Short downtime",
  content: ""
};

describe("announcement draft", () => {
  it("needs at least one complete translation", () => {
    expect(announcementIssues(emptyAnnouncementForm())).toEqual(["TEXTS_MISSING"]);
    expect(
      announcementIssues({
        ...emptyAnnouncementForm(),
        texts: {
          en: {
            ...filled,
            description: ""
          }
        }
      })
    ).toEqual(["TEXTS_MISSING", "TEXTS_INCOMPLETE"]);
  });

  it("flags a start after the expiry", () => {
    const form = {
      ...emptyAnnouncementForm(),
      texts: { en: filled },
      startsAt: "2026-11-05T10:00",
      expiresAt: "2026-11-04T10:00"
    };
    expect(announcementIssues(form)).toEqual(["DATES_ORDER"]);
  });

  it("builds an input the API schema accepts, dropping empty locales and severity outside warnings", () => {
    const form = {
      ...emptyAnnouncementForm(),
      texts: {
        en: filled,
        fr: {
          title: "",
          description: "",
          content: ""
        }
      },
      severity: 3 as const,
      pinned: true
    };
    const input = buildAnnouncementInput(form);

    expect(Object.keys(input.translations)).toEqual(["en"]);
    expect(input.severity).toBeNull();
    expect(AnnouncementInputSchema.safeParse(input).success).toBe(true);
    expect(
      AnnouncementInputSchema.safeParse(
        buildAnnouncementInput({
          ...form,
          kind: "warning"
        })
      ).success
    ).toBe(true);
  });
});