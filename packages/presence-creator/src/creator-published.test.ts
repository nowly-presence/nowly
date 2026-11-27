import { describe, expect, it } from "vitest";
import { matchesPath } from "./creator-activity";
import { generatePresenceSource } from "./creator-codegen";
import { createCondition, createConditionAction } from "./creator-conditions";
import { addVariable, createPage, createVariable } from "./creator-draft";
import { sampleCreatorDraft } from "./creator-fixtures";

describe("published presence matches the preview", () => {
  it("keeps the activity when a condition replaces a missing first line", () => {
    const draft = sampleCreatorDraft();
    const [watch] = draft.pages;
    const source = generatePresenceSource({
      ...draft,
      pages: [
        {
          ...watch,
          conditions: [
            {
              ...createCondition(watch.variables[0].id),
              operator: "empty",
              actions: [
                {
                  ...createConditionAction("details", watch),
                  id: "browsing"
                }
              ]
            }
          ]
        }
      ]
    });
    expect(source).toContain("if (!rule1Matches && (!title)) {");
    expect(source).toContain('formatString(strings.watchDetails, { title: title ?? "" })');
  });

  it("compares addresses the same way", () => {
    expect(matchesPath("startsWith", "/movie/", "/movies")).toBe(false);
    expect(matchesPath("equals", "/watch", "/watch/")).toBe(true);
    const draft = sampleCreatorDraft();
    const page = createPage("Watch", "watch/");
    const source = generatePresenceSource({
      ...draft,
      pages: [
        {
          ...page,
          match: {
            ...page.match,
            mode: "equals"
          }
        }
      ]
    });
    expect(source).toContain('if (pathname === "/watch" || pathname === "/watch/") {');
  });

  it("renames elements that would break the generated code", () => {
    let page = createPage("Watch");

    for (const name of ["default", "data", "rule1Matches", "title"]) page = addVariable(page, createVariable(name, { kind: "tabTitle" })).page;

    expect(page.variables.map((variable) => variable.name)).toEqual(["default2", "data2", "rule1Matches2", "title"]);
  });
});