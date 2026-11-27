import { describe, expect, it } from "vitest";
import { buildPreviewActivity } from "./creator-activity";
import { generatePresenceSource } from "./creator-codegen";
import { createCondition, createConditionAction, evaluateCondition } from "./creator-conditions";
import { buildLocaleFiles } from "./creator-files";
import { sampleCreatorDraft } from "./creator-fixtures";
import { parseCreatorDefinition } from "./creator-schema";
import type { CreatorCondition, CreatorConditionAction, CreatorDraft, CreatorPage } from "./creator-types";
import { validateDraft } from "./creator-validation";

const condition = (patch: Partial<CreatorCondition>): CreatorCondition => ({ ...createCondition("v"), ...patch });

const withConditions = (build: (page: CreatorPage) => CreatorCondition[]): CreatorDraft => {
  const draft = sampleCreatorDraft();
  const [watch, ...rest] = draft.pages;
  return {
    ...draft,
    pages: [
      {
        ...watch,
        conditions: build(watch)
      },
      ...rest
    ]
  };
};

const action = (page: CreatorPage, kind: CreatorConditionAction["kind"], patch: Record<string, unknown> = {}): CreatorConditionAction =>
  ({ ...createConditionAction(kind, page), ...patch }) as CreatorConditionAction;

const extraction = (page: CreatorPage, values: Record<string, string>) => ({
  url: "https://example.com/watch",
  values: page.variables.map((variable) => ({
    variableId: variable.id,
    value: values[variable.name]
  }))
});

const OPTIONS = {
  nowMs: 10_000,
  startedAtMs: 0,
  pageUrl: "https://example.com/watch"
};

describe("condition evaluation", () => {
  it("compares text without case", () => {
    expect(
      evaluateCondition(
        condition({
          operator: "contains",
          value: "Trailer"
        }),
        "Season 2 trailer"
      )
    ).toBe(true);
    expect(
      evaluateCondition(
        condition({
          operator: "equals",
          value: "live "
        }),
        "LIVE"
      )
    ).toBe(true);
    expect(
      evaluateCondition(
        condition({
          operator: "startsWith",
          value: "ep"
        }),
        "Episode 1"
      )
    ).toBe(true);
    expect(
      evaluateCondition(
        condition({
          operator: "matches",
          value: "^ep\\s\\d+$"
        }),
        "Ep 12"
      )
    ).toBe(true);
    expect(evaluateCondition(condition({ operator: "empty" }), undefined)).toBe(true);
  });

  it("reads numbers written with separators", () => {
    const number = (operator: CreatorCondition["operator"], value: string, valueMax = "") =>
      condition({
        type: "number",
        operator,
        value,
        valueMax
      });
    expect(evaluateCondition(number("gt", "1000"), "1 284 viewers")).toBe(true);
    expect(evaluateCondition(number("between", "100", "500"), "1,284")).toBe(false);
    expect(evaluateCondition(number("lte", "3"), undefined)).toBe(false);
  });

  it("tells whether an element is on the page", () => {
    expect(
      evaluateCondition(
        condition({
          type: "boolean",
          operator: "exists"
        }),
        "LIVE"
      )
    ).toBe(true);
    expect(
      evaluateCondition(
        condition({
          type: "boolean",
          operator: "missing"
        }),
        undefined
      )
    ).toBe(true);
  });
});

describe("condition output", () => {
  const draft = withConditions((page) => {
    const [title, , poster] = page.variables;
    return [
      condition({
        variableId: title.id,
        operator: "contains",
        value: "Trailer",
        actions: [
          action(page, "state", {
            text: {
              "en-US": "Trailer of {channel}",
              "fr-FR": "Bande-annonce de {channel}"
            }
          }),
          action(page, "hideButton", { buttonId: "b1" }),
          action(page, "timestamps", { timestamps: "elapsed" })
        ],
        elseActions: [
          action(page, "smallImage", {
            image: {
              kind: "variable",
              variableId: poster.id
            }
          })
        ]
      }),
      condition({
        variableId: title.id,
        operator: "empty",
        actions: [action(page, "hidePresence")]
      })
    ];
  });

  it("writes one string per condition text in every locale", () => {
    const files = buildLocaleFiles(draft);
    expect(files["en-US"].watchRule1Text1).toBe("Trailer of {channel}");
    expect(files["fr-FR"].watchRule1Text1).toBe("Bande-annonce de {channel}");
  });

  it("generates the conditions in the presence", () => {
    const source = generatePresenceSource(draft);
    expect(source).toContain('const rule1Matches = textOf(title).includes("trailer")');
    expect(source).toContain("const rule2Matches = !title");
    expect(source).toContain("if (rule2Matches) {");
    expect(source).toContain("state: rule1Matches ? presence.formatString(strings.watchRule1Text1");
    expect(source).toContain("smallImageKey: !rule1Matches && poster ? poster : undefined,");
    expect(source).toContain('const timestamps = rule1Matches ? "elapsed" : "media"');
    expect(source).toContain("if (!rule1Matches && buttonUrl1) buttons.push(");
    expect(source).toContain("const textOf = ");
  });

  it("applies the actions to the preview, last one winning", () => {
    const page = draft.pages[0];
    const trailer = buildPreviewActivity(
      draft,
      page,
      extraction(page, {
        title: "Big trailer",
        channel: "Nowly",
        poster: "https://cdn.example.com/p.jpg",
        videoId: "1"
      }),
      "en-US",
      OPTIONS
    );
    expect(trailer.activity.state).toBe("Trailer of Nowly");
    expect(trailer.activity.buttons).toBeUndefined();
    expect(trailer.activity.startTimestamp).toBe(0);
    expect(trailer.smallImage).toBeUndefined();
    expect(trailer.hidden).toBe(false);

    const other = buildPreviewActivity(
      draft,
      page,
      extraction(page, {
        title: "Episode",
        channel: "Nowly",
        poster: "https://cdn.example.com/p.jpg",
        videoId: "1"
      }),
      "en-US",
      OPTIONS
    );
    expect(other.smallImage).toBe("https://cdn.example.com/p.jpg");
    expect(other.activity.buttons).toHaveLength(1);

    const empty = buildPreviewActivity(draft, page, extraction(page, {}), "en-US", OPTIONS);
    expect(empty.hidden).toBe(true);
  });

  it("validates conditions and keeps them through the schema", () => {
    expect(validateDraft(draft)).toEqual([]);
    expect(parseCreatorDefinition(draft)?.pages[0].conditions).toHaveLength(2);

    const broken = withConditions((page) => [
      condition({
        variableId: page.variables[0].id,
        type: "number",
        operator: "gt",
        value: "abc",
        actions: [action(page, "details")]
      })
    ]);
    const codes = validateDraft(broken).map((issue) => issue.code);
    expect(codes).toContain("pageConditionInvalid");
    expect(codes).toContain("pageConditionTextMissing");
    expect(generatePresenceSource(broken)).not.toContain("rule1Matches");
  });
});