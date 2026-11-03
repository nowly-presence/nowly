import { CREATOR_BUILTIN_STRINGS } from "@/shared/creator/creator-builtin-strings";
import { imageVariableOf, linkVariableOf, templateTokens } from "@/shared/creator/creator-activity";
import { pageStringKeys, writtenLocales, type StringKeys } from "@/shared/creator/creator-files";
import type { CreatorActivityType, CreatorDraft, CreatorPage, CreatorSource } from "@/shared/creator/creator-types";

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

const conditionFor = (page: CreatorPage): string | null => {
  const path = page.match.path.trim();

  if (page.match.mode === "any" || !path) return null;

  const normalized = path.startsWith("/") || page.match.mode === "contains" ? path : `/${path}`;

  if (page.match.mode === "equals") return `pathname === ${quote(normalized)}`;
  if (page.match.mode === "startsWith") return `pathname.startsWith(${quote(normalized)})`;

  return `pathname.includes(${quote(normalized)})`;
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

const buttonTarget = (page: CreatorPage, names: Set<string>): {
  conditions: string[];
  url: string;
} => {
  const link = page.button.link;

  if (link.kind === "custom") return {
    conditions: urlVariables(link.template, names),
    url: urlLiteral(link.template, names)
  };

  const variable = linkVariableOf(page);
  return variable ? { conditions: [variable.name], url: variable.name } : { conditions: [], url: "pageUrl" };
};

const pageBlock = (draft: CreatorDraft, page: CreatorPage, keys: StringKeys, hasButtonSetting: boolean): string[] => {
  const base = draft.baseLocale;
  const names = new Set(page.variables.map((variable) => variable.name));
  const detailsTemplate = page.details[base] ?? "";
  const required = [...new Set(templateTokens(detailsTemplate))].filter((name) => names.has(name));

  const requiredSet = new Set(required);
  const lines = page.variables.map((variable) => `const ${variable.name} = ${sourceExpression(variable.source)}`);
  if (required.length > 0) lines.push(`if (${required.map((name) => `!${name}`).join(" || ")}) {`, "  presence.clearActivity()", "  return", "}");
  lines.push(
    "const data: PresenceData = {",
    `  details: ${formatCall(keys.details, detailsTemplate, names, requiredSet)},`,
    ...(keys.state ? [`  state: ${formatCall(keys.state, page.state[base] ?? "", names, requiredSet)},`] : []),
    `  largeImageKey: ${imageExpression(page, names)},`,
    `  largeImageText: ${quote(draft.name.trim())},`,
    `  type: PresenceType.${ACTIVITY_TYPE_NAMES[page.activityType]},`,
    "}"
  );

  if (page.timestamps === "media") {
    lines.push(
      'const media = document.querySelector<HTMLMediaElement>("video, audio")',
      "if (media) Object.assign(data, createMediaTimestamps(media))",
      "else data.startTimestamp = pageStartedAt"
    );
  } else lines.push("data.startTimestamp = pageStartedAt");

  if (keys.button && hasButtonSetting) {
    const target = buttonTarget(page, names);
    const condition = ["showButtons", ...target.conditions.filter((name) => !requiredSet.has(name))].join(" && ");
    lines.push(
      `if (${condition}) data.buttons = [{ label: ${formatCall(keys.button, page.button.label[base] ?? "", names, requiredSet)}, url: ${target.url} }]`
    );
  }

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

export const generatePresenceSource = (draft: CreatorDraft): string => {
  const keys = pageStringKeys(draft);
  const sources = draft.pages.flatMap((page) => page.variables.map((variable) => variable.source));
  const helpers = (Object.keys(HELPER_SOURCES) as Helper[]).filter((helper) => sources.some((source) => helperFor(source) === helper));

  const usesMedia = draft.pages.some((page) => page.timestamps === "media");
  const tracksPageTime = draft.pages.length > 0;
  const hasButtons = keys.some((entry) => Boolean(entry.button));
  const usesPageUrl = draft.pages.some(
    (page, index) => Boolean(keys[index].button) && buttonTarget(page, new Set(page.variables.map((variable) => variable.name))).url === "pageUrl"
  );
  const settings = [
    ...(hasButtons ? settingEntry(draft, "showButtons", true) : []),
    ...(draft.browsingFallback ? settingEntry(draft, "showBrowsing", false) : [])
  ];
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
    ...(settings.length > 0
      ? [
          "const settings = Presence.Settings({",
          ...settings,
          "})",
          "",
          "const presence = new Presence(settings)",
          'const isEnabled = (value: unknown): boolean => value === true || value === "true"'
        ]
      : ["const presence = new Presence()"]),
    ...(tracksPageTime ? ['let currentPath = ""', "let pageStartedAt = Math.floor(Date.now() / 1000)"] : []),
    ...helpers.flatMap((helper) => ["", ...HELPER_SOURCES[helper]]),
    "",
    `presence.on("UpdateData", async (${settings.length > 0 ? "ctx" : ""}) => {`,
    ...indent(handler, 1),
    "})",
    ""
  ].join("\n");
};