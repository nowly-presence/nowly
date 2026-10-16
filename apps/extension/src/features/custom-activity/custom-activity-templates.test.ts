import { describe, expect, it } from "vitest";
import { CUSTOM_ACTIVITY_TEMPLATE_IDS, CUSTOM_ACTIVITY_TEMPLATES, isCustomActivityTemplateId } from "./custom-activity-templates";

describe("custom activity templates", () => {
  it("offers nine templates plus Blank for five complete two-column rows", () => {
    expect(CUSTOM_ACTIVITY_TEMPLATE_IDS).toHaveLength(9);
    expect((CUSTOM_ACTIVITY_TEMPLATE_IDS.length + 1) % 2).toBe(0);
    expect(Object.keys(CUSTOM_ACTIVITY_TEMPLATES)).toEqual([...CUSTOM_ACTIVITY_TEMPLATE_IDS]);
    expect(new Set(CUSTOM_ACTIVITY_TEMPLATE_IDS).size).toBe(9);
  });

  it("accepts each offered template and no longer offers Focus", () => {
    for (const id of CUSTOM_ACTIVITY_TEMPLATE_IDS) expect(isCustomActivityTemplateId(id)).toBe(true);

    expect(isCustomActivityTemplateId("focus")).toBe(false);
    expect(isCustomActivityTemplateId(undefined)).toBe(false);
  });
});