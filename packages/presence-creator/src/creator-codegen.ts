import { CREATOR_BUILTIN_STRINGS } from "./creator-builtin-strings";
import { imageVariableOf, linkVariableOf, matchPaths, templateTokens, withLeadingSlash, withoutTrailingSlash } from "./creator-activity";
import { CONDITION_HELPER_SOURCES, conditionExpression, conditionHelper, conditionVariable, usableConditions } from "./creator-conditions";
import { pageStringKeys, writtenLocales, type StringKeys } from "./creator-files";
import type { CreatorActivityType, CreatorButton, CreatorConditionAction, CreatorDraft, CreatorImage, CreatorLink, CreatorPage, CreatorSmallImage, CreatorSource, CreatorTimestamps } from "./creator-types";

type Helper = "text" | "image" | "link" | "meta" | "title";

const ACTIVITY_TYPE_NAMES: Record<CreatorActivityType, string> = {
  watching: "Watching",
  listening: "Listening",
  playing: "Playing",
  competing: "Competing"
};

const HELPER_SOURCES: Record<Helper, string[]> = {
  text: [
    "const readText = (selector: string): string | undefined =>",
    '  document.querySelector(selector)?.textContent?.replace(/\\s+/g, " ").trim() || undefined'
  ],
  image: [
    "const readImage = (selector: string): string | undefined => {",
    "  const element = document.querySelector(selector)",
    '  const source = element instanceof HTMLImageElement ? element.currentSrc || element.src : element?.getAttribute("src") ?? undefined',
    '  return source?.startsWith("https://") ? source : undefined',
    "}"
  ],
  link: [
    "const readLink = (selector: string): string | undefined => {",
    "  const element = document.querySelector(selector)",
    "  return element instanceof HTMLAnchorElement ? element.href : undefined",
    "}"
  ],
  meta: [
    "const readMeta = (property: string): string | undefined =>",
    '  document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)?.content.trim() || undefined'
  ],
  title: ["const readTabTitle = (): string | undefined => document.title.trim() || undefined"]
};

const quote = (value: string): string => JSON.stringify(value);

const helperFor = (source: CreatorSource): Helper => {
  if (source.kind === "tabTitle") return "title";
  if (source.kind === "meta") return "meta";

  return source.read;
};

const sourceExpression = (source: CreatorSource): string => {
  if (source.kind === "tabTitle") return "readTabTitle()";
  if (source.kind === "meta") return `readMeta(${quote(source.property)})`;

  const reader = source.read === "text" ? "readText" : source.read === "image" ? "readImage" : "readLink";
  return `${reader}(${quote(source.selector)})`;
};

const pathCheck = (mode: CreatorPage["match"]["mode"], path: string): string => {
  if (mode === "contains") return `pathname.includes(${quote(path)})`;
  if (mode === "startsWith") return `pathname.startsWith(${quote(withLeadingSlash(path))})`;

  const bare = withoutTrailingSlash(withLeadingSlash(path));

  return bare === "/" ? 'pathname === "/"' : `pathname === ${quote(bare)} || pathname === ${quote(`${bare}/`)}`;
};

const conditionFor = (page: CreatorPage): string | null => {
  const paths = matchPaths(page);
  return paths.length === 0 ? null : paths.map((path) => pathCheck(page.match.mode, path)).join(" || ");
};

const formatCall = (key: string, template: string, variableNames: Set<string>, required: Set<string>): string => {
  const used = [...new Set(templateTokens(template))].filter((name) => variableNames.has(name));

  if (used.length === 0) return `strings.${key}`;

  return `presence.formatString(strings.${key}, { ${used.map((name) => (required.has(name) ? name : `${name}: ${name} ?? ""`)).join(", ")} })`;
};

const TEMPLATE_PART = /(\{[a-zA-Z][a-zA-Z0-9]*\})/;

const urlLiteral = (template: string, names: Set<string>): string => {
  const parts = template
    .trim()
    .split(TEMPLATE_PART)
    .map((part) => {
      const name = /^\{([a-zA-Z][a-zA-Z0-9]*)\}$/.exec(part)?.[1];
      return name && names.has(name) ? `\${${name}}` : part.replace(/[\\`$]/g, (character) => `\\${character}`);
    });
  return `\`${parts.join("")}\``;
};

const urlVariables = (template: string, names: Set<string>): string[] => [...new Set(templateTokens(template))].filter((name) => names.has(name));

const imageExpression = (page: CreatorPage, names: Set<string>): string => {
  const image = page.largeImage;

  if (image.kind === "custom") {
    const used = urlVariables(image.template, names);
    const literal = urlLiteral(image.template, names);
    return used.length > 0 ? `${used.join(" && ")} ? ${literal} : Assets.Logo` : literal;
  }

  const variable = imageVariableOf(page);
  return variable ? `${variable.name} ?? Assets.Logo` : "Assets.Logo";
};

const buttonTarget = (page: CreatorPage, button: CreatorButton, names: Set<string>): {
  conditions: string[];
  url: string;
} => {
  const link = button.link;

  if (link.kind === "custom") return {
    conditions: urlVariables(link.template, names),
    url: urlLiteral(link.template, names)
  };

  const variable = linkVariableOf(page, button);
  return variable ? { conditions: [variable.name], url: variable.name } : { conditions: [], url: "pageUrl" };
};

type Override = {
  guard: string;
  action: CreatorConditionAction;
};

type Guarded = {
  guards: string[];
  expression: string;
};

const pageOverrides = (page: CreatorPage): Override[] =>
  usableConditions(page).flatMap((condition, index) => {
    const name = `rule${index + 1}Matches`;
    return [
      ...condition.actions.map((action) => ({
        guard: name,
        action
      })),
      ...condition.elseActions.map((action) => ({
        guard: `!${name}`,
        action
      }))
    ];
  });

const conditionLines = (page: CreatorPage): string[] =>
  usableConditions(page).flatMap((condition, index) => {
    const variable = conditionVariable(page, condition);
    return variable ? [`const rule${index + 1}Matches = ${conditionExpression(condition, variable.name)}`] : [];
  });

const fold = (base: string, entries: Guarded[]): string =>
  entries.reduce((current, entry) => `${entry.guards.join(" && ")} ? ${entry.expression} : ${current}`, base);

const sourceOverride = (page: CreatorPage, guard: string, source:
  CreatorImage | CreatorSmallImage | CreatorLink, names: Set<string>, fixed: string): Guarded => {
  if (source.kind === "custom") return {
    guards: [guard, ...urlVariables(source.template, names)],
    expression: urlLiteral(source.template, names)
  };

  if (source.kind === "variable") {
    const variable = page.variables.find((entry) => entry.id === source.variableId);

    if (variable) return {
      guards: [guard, variable.name],
      expression: variable.name
    };
  }

  return {
    guards: [guard],
    expression: fixed
  };
};

const timestampLines = (page: CreatorPage, overrides: Override[]): string[] => {
  const mediaLines = [
    'const media = document.querySelector<HTMLMediaElement>("video, audio")',
    "if (media) Object.assign(data, createMediaTimestamps(media))",
    "else data.startTimestamp = pageStartedAt"
  ];
  const entries = overrides.flatMap((override) =>
    override.action.kind === "timestamps"
      ? [
          {
            guard: override.guard,
            mode: override.action.timestamps
          }
        ]
      : []
  );

  const modes = new Set<CreatorTimestamps>([page.timestamps, ...entries.map((entry) => entry.mode)]);

  if (modes.size === 1) return page.timestamps === "media" ? mediaLines : ["data.startTimestamp = pageStartedAt"];

  return [
    `const timestamps = ${fold(
      quote(page.timestamps),
      entries.map((entry) => ({
        guards: [entry.guard],
        expression: quote(entry.mode)
      }))
    )}`,
    'if (timestamps === "media") {',
    ...indent(mediaLines, 1),
    "} else data.startTimestamp = pageStartedAt"
  ];
};

const negate = (guards: string[]): string => (guards.length === 1 && !guards[0].startsWith("!") ? `!${guards[0]}` : `!(${guards.join(" || ")})`);

type BlockContext = {
  draft: CreatorDraft;
  page: CreatorPage;
  keys: StringKeys;
  names: Set<string>;
  required: Set<string>;
  overrides: Override[];
};

const actionText = (context: BlockContext, override: Override): string =>
  "text" in override.action
    ? formatCall(context.keys.conditions[override.action.id], override.action.text[context.draft.baseLocale] ?? "", context.names, context.required)
    : "";

const textOverrides = (context: BlockContext, kind: CreatorConditionAction["kind"]): Guarded[] =>
  context.overrides
    .filter((override) => override.action.kind === kind)
    .map((override) => ({
      guards: [override.guard],
      expression: actionText(context, override)
    }));

const buttonLines = (context: BlockContext): string[] => {
  const { draft, page, keys, names, required, overrides } = context;
  const base = draft.baseLocale;
  const buttonOverrides = overrides.filter((override) => "buttonId" in override.action);

  if (buttonOverrides.length === 0) {
    const entries = page.buttons.map((button, position) => {
      const target = buttonTarget(page, button, names);
      const conditions = target.conditions.filter((name) => !required.has(name));

      const entry = `{ label: ${formatCall(keys.buttons[position], button.label[base] ?? "", names, required)}, url: ${target.url} }`;
      return { conditions, entry };
    });

    if (entries.length === 1) return [`if (${["showButtons", ...entries[0].conditions].join(" && ")}) data.buttons = [${entries[0].entry}]`];

    return [
      "if (showButtons) {",
      '  const buttons: NonNullable<PresenceData["buttons"]> = []',
      ...entries.map((item) =>
        item.conditions.length > 0 ? `  if (${item.conditions.join(" && ")}) buttons.push(${item.entry})` : `  buttons.push(${item.entry})`
      ),
      "  if (buttons.length > 0) data.buttons = buttons",
      "}"
    ];
  }

  const blocks = page.buttons.flatMap((button, position) => {
    const mine = buttonOverrides.filter((override) => "buttonId" in override.action && override.action.buttonId === button.id);

    const target = buttonTarget(page, button, names);
    const baseUrl = target.conditions.length > 0 ? `${target.conditions.join(" && ")} ? ${target.url} : undefined` : target.url;
    const url = fold(
      baseUrl,
      mine.flatMap((override) => (override.action.kind === "buttonLink" ? [sourceOverride(page, override.guard, override.action.link, names, "pageUrl")] : []))
    );
    const label = fold(
      formatCall(keys.buttons[position], button.label[base] ?? "", names, required),
      mine
        .filter((override) => override.action.kind === "buttonLabel")
        .map((override) => ({
          guards: [override.guard],
          expression: actionText(context, override)
        }))
    );
    const hidden = mine.filter((override) => override.action.kind === "hideButton").map((override) => override.guard);

    const variable = `buttonUrl${position + 1}`;
    return [
      `  const ${variable} = ${url}`,
      `  if (${[...(hidden.length > 0 ? [negate(hidden)] : []), variable].join(" && ")}) buttons.push({ label: ${label}, url: ${variable} })`
    ];
  });

  return [
    "if (showButtons) {",
    '  const buttons: NonNullable<PresenceData["buttons"]> = []',
    ...blocks,
    "  if (buttons.length > 0) data.buttons = buttons",
    "}"
  ];
};

const pageBlock = (draft: CreatorDraft, page: CreatorPage, keys: StringKeys, hasButtonSetting: boolean): string[] => {
  const base = draft.baseLocale;
  const names = new Set(page.variables.map((variable) => variable.name));
  const detailsTemplate = page.details[base] ?? "";
  const detailsVariables = urlVariables(detailsTemplate, names);
  const overrides = pageOverrides(page);
  const detailsGuards = overrides.filter((override) => override.action.kind === "details").map((override) => override.guard);

  const required = new Set(detailsGuards.length > 0 ? [] : detailsVariables);
  const context: BlockContext = { draft, page, keys, names, required, overrides };

  const lines = page.variables.map((variable) => `const ${variable.name} = ${sourceExpression(variable.source)}`);
  lines.push(...conditionLines(page));
  const hiding = overrides.filter((override) => override.action.kind === "hidePresence").map((override) => override.guard);
  if (hiding.length > 0) lines.push(`if (${hiding.join(" || ")}) {`, "  presence.clearActivity()", "  return", "}");

  if (detailsVariables.length > 0) {
    const absent = detailsVariables.map((name) => `!${name}`).join(" || ");
    const check = detailsGuards.length > 0 ? `${negate(detailsGuards)} && (${absent})` : absent;
    lines.push(`if (${check}) {`, "  presence.clearActivity()", "  return", "}");
  }

  const stateOverrides = textOverrides(context, "state");
  const nameOverrides = textOverrides(context, "activityName");
  const largeImages = overrides.flatMap((override) =>
    override.action.kind === "largeImage" ? [sourceOverride(page, override.guard, override.action.image, names, "Assets.Logo")] : []
  );
  const smallImages = overrides.flatMap((override) =>
    override.action.kind === "smallImage" ? [sourceOverride(page, override.guard, override.action.image, names, "Assets.Icon")] : []
  );
  const types = overrides.flatMap((override) =>
    override.action.kind === "activityType"
      ? [
          {
            guards: [override.guard],
            expression: `PresenceType.${ACTIVITY_TYPE_NAMES[override.action.activityType]}`
          }
        ]
      : []
  );
  lines.push(
    "const data: PresenceData = {",
    ...(nameOverrides.length > 0 ? [`  name: ${fold("undefined", nameOverrides)},`] : []),
    `  details: ${fold(formatCall(keys.details, detailsTemplate, names, required), textOverrides(context, "details"))},`,
    ...(keys.state || stateOverrides.length > 0
      ? [`  state: ${fold(keys.state ? formatCall(keys.state, page.state[base] ?? "", names, required) : "undefined", stateOverrides)},`]
      : []),
    `  largeImageKey: ${fold(imageExpression(page, names), largeImages)},`,
    `  largeImageText: ${fold(quote(draft.name.trim()), textOverrides(context, "imageText"))},`,
    ...(smallImages.length > 0 ? [`  smallImageKey: ${fold("undefined", smallImages)},`] : []),
    `  type: ${fold(`PresenceType.${ACTIVITY_TYPE_NAMES[page.activityType]}`, types)},`,
    "}"
  );

  lines.push(...timestampLines(page, overrides));

  if (page.buttons.length > 0 && hasButtonSetting) lines.push(...buttonLines(context));

  lines.push("await presence.setActivity(data)", "return");
  return lines;
};

const settingEntry = (draft: CreatorDraft, key: "showButtons" | "showBrowsing", fallback: boolean): string[] => {
  const locales = writtenLocales(draft).includes("en-US") ? writtenLocales(draft) : ["en-US" as const, ...writtenLocales(draft)];
  const label = key === "showButtons" ? "showButtonsLabel" : "showBrowsingLabel";
  const description = key === "showButtons" ? "showButtonsDescription" : "showBrowsingDescription";
  const block = (field: typeof label | typeof description) => [
    `    ${field === label ? "label" : "description"}: {`,
    ...locales.map((locale) => `      ${quote(locale)}: ${quote(CREATOR_BUILTIN_STRINGS[locale][field])},`),
    "    },"
  ];
  return [`  ${key}: {`, '    type: "boolean",', `    default: ${fallback},`, ...block(label), ...block(description), "  },"];
};

const indent = (lines: string[], depth: number): string[] => lines.map((line) => (line ? `${"  ".repeat(depth)}${line}` : line));

const settingLines = (draft: CreatorDraft, hasButtons: boolean): string[] => [
  ...(hasButtons ? settingEntry(draft, "showButtons", true) : []),
  ...(draft.browsingFallback ? settingEntry(draft, "showBrowsing", false) : [])
];

export const generateSettingsSource = (draft: CreatorDraft): string | null => {
  const keys = pageStringKeys(draft);
  const lines = settingLines(
    draft,
    keys.some((entry) => entry.buttons.length > 0)
  );

  if (lines.length === 0) return null;

  return ['import type { PresenceSetting } from "@nowly/sdk"', "", "export default {", ...lines, "} satisfies Record<string, PresenceSetting>", ""].join("\n");
};

export const generatePresenceSource = (draft: CreatorDraft): string => {
  const keys = pageStringKeys(draft);
  const sources = draft.pages.flatMap((page) => page.variables.map((variable) => variable.source));
  const helpers = (Object.keys(HELPER_SOURCES) as Helper[]).filter((helper) => sources.some((source) => helperFor(source) === helper));

  const usesMedia = draft.pages.some(
    (page) =>
      page.timestamps === "media" || pageOverrides(page).some((override) => override.action.kind === "timestamps" && override.action.timestamps === "media")
  );
  const conditionHelpers = (Object.keys(CONDITION_HELPER_SOURCES) as (keyof typeof CONDITION_HELPER_SOURCES)[]).filter((helper) =>
    draft.pages.some((page) => usableConditions(page).some((condition) => conditionHelper(condition) === helper))
  );

  const tracksPageTime = draft.pages.length > 0;
  const hasButtons = keys.some((entry) => entry.buttons.length > 0);
  const usesPageUrl = draft.pages.some(
    (page) =>
      page.buttons.some((button) => buttonTarget(page, button, new Set(page.variables.map((variable) => variable.name))).url === "pageUrl") ||
      pageOverrides(page).some((override) => override.action.kind === "buttonLink" && override.action.link.kind === "page")
  );
  const settings = settingLines(draft, hasButtons);
  const sdkImports = [...(usesMedia ? ["createMediaTimestamps"] : []), "PresenceType", "type PresenceData"];

  const handler: string[] = [
    "const strings = await presence.getStrings<typeof baseStrings>()",
    "const { pathname } = window.location",
    ...(hasButtons ? ['const showButtons = !("showButtons" in ctx.settings) || isEnabled(ctx.settings.showButtons)'] : []),
    ...(usesPageUrl ? ["const pageUrl = `${window.location.origin}${pathname}`"] : []),
    ...(tracksPageTime ? ["if (pathname !== currentPath) {", "  currentPath = pathname", "  pageStartedAt = Math.floor(Date.now() / 1000)", "}"] : [])
  ];
  draft.pages.forEach((page, index) => {
    const condition = conditionFor(page);
    const block = pageBlock(draft, page, keys[index], hasButtons);
    handler.push("", ...(condition ? [`if (${condition}) {`, ...indent(block, 1), "}"] : ["{", ...indent(block, 1), "}"]));
  });
  handler.push(
    "",
    ...(draft.browsingFallback
      ? [
          "if (isEnabled(ctx.settings.showBrowsing)) {",
          `  await presence.setActivity({ details: ${quote(draft.name.trim())}, state: strings.browsing, largeImageKey: Assets.Logo, type: PresenceType.Watching })`,
          "  return",
          "}"
        ]
      : []),
    "presence.clearActivity()"
  );

  return [
    `import { ${sdkImports.join(", ")} } from "@nowly/sdk"`,
    `import type baseStrings from "./locales/${draft.baseLocale}.json"`,
    "",
    "const presence = new Presence()",
    ...(settings.length > 0 ? ['const isEnabled = (value: unknown): boolean => value === true || value === "true"'] : []),
    ...(tracksPageTime ? ['let currentPath = ""', "let pageStartedAt = Math.floor(Date.now() / 1000)"] : []),
    ...helpers.flatMap((helper) => ["", ...HELPER_SOURCES[helper]]),
    ...conditionHelpers.flatMap((helper) => ["", ...CONDITION_HELPER_SOURCES[helper]]),
    "",
    `presence.on("UpdateData", async (${settings.length > 0 ? "ctx" : ""}) => {`,
    ...indent(handler, 1),
    "})",
    ""
  ].join("\n");
};