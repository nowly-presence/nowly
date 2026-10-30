import en from "../../../messages/en.json";
import { describe, expect, it } from "vitest";
import type { Translate } from "@/hooks/i18n-provider";
import { CUSTOM_ACTIVITY_COLORS, CUSTOM_ACTIVITY_ICONS, validateCustomActivity } from "@/shared/custom-activity";
import { CUSTOM_ACTIVITY_TEMPLATE_IDS, CUSTOM_ACTIVITY_TEMPLATES, draftFromTemplate, isCustomActivityTemplateId } from "./custom-activity-templates";

const t: Translate = (key) => en[key];

describe("custom activity templates", () => {
  it("defines exactly one template per unique id and rejects removed or missing ids", () => {
    expect(Object.keys(CUSTOM_ACTIVITY_TEMPLATES)).toEqual([...CUSTOM_ACTIVITY_TEMPLATE_IDS]);
    expect(new Set(CUSTOM_ACTIVITY_TEMPLATE_IDS).size).toBe(CUSTOM_ACTIVITY_TEMPLATE_IDS.length);

    for (const id of CUSTOM_ACTIVITY_TEMPLATE_IDS) expect(isCustomActivityTemplateId(id)).toBe(true);

    expect(isCustomActivityTemplateId("focus")).toBe(false);
    expect(isCustomActivityTemplateId(undefined)).toBe(false);
  });

  it.each(CUSTOM_ACTIVITY_TEMPLATE_IDS)("prefills %s with a valid draft whose icon image the web route can render", (id) => {
    const draft = draftFromTemplate(id, t);

    expect(validateCustomActivity(draft)).toEqual({});
    expect(draft.name.trim()).not.toBe("");
    expect(draft.largeImage).toMatchObject({ kind: "icon" });

    if (draft.largeImage.kind !== "icon") return;

    expect(CUSTOM_ACTIVITY_ICONS).toContain(draft.largeImage.icon);
    expect(CUSTOM_ACTIVITY_COLORS).toContain(draft.largeImage.color);
  });
});