#!/usr/bin/env node
import { readFileSync, readdirSync, type Dirent } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();

type AppConfig = {
  name: string;
  mode: "nested" | "flat";
  messagesDir: string;
  base: string;
  srcDirs: string[];
};

type NamespaceBinding = {
  kind: "root" | "static" | "dynamic";
  value: string;
};

type CheckResult = {
  unusedKeys: string[];
  usedMissingFromBase: string[];
};

const APPS: AppConfig[] = [
  {
    name: "web",
    mode: "nested",
    messagesDir: "apps/web/messages",
    base: "en-US.json",
    srcDirs: [
      "apps/web/app",
      "apps/web/components",
      "apps/web/features",
      "apps/web/lib",
      "apps/web/hooks",
      "packages/ui/src",
    ],
  },
  {
    name: "docs",
    mode: "nested",
    messagesDir: "apps/docs/messages",
    base: "en-US.json",
    srcDirs: [
      "apps/docs/app",
      "apps/docs/components",
      "apps/docs/features",
      "apps/docs/lib",
      "apps/docs/hooks",
      "packages/ui/src",
    ],
  },
  {
    name: "extension",
    mode: "flat",
    messagesDir: "apps/extension/messages",
    base: "en.json",
    srcDirs: ["apps/extension/src"],
  },
];

const SOURCE_EXT = new Set([".ts", ".tsx"]);

const walk = (dir: string): string[] => {
  const abs = join(ROOT, dir);
  let entries: Dirent[];
  try {
    entries = readdirSync(abs, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const rel = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === "dist"
      )
        continue;
      files.push(...walk(rel));
    } else if (SOURCE_EXT.has(extname(entry.name))) {
      files.push(rel);
    }
  }
  return files;
};

const isMessageTree = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const readMessages = (app: AppConfig): Record<string, unknown> => {
  const messages: unknown = JSON.parse(
    readFileSync(join(ROOT, app.messagesDir, app.base), "utf-8"),
  );
  if (!isMessageTree(messages))
    throw new Error(`Invalid message tree: ${app.messagesDir}/${app.base}`);
  return messages;
};

const flatten = (obj: Record<string, unknown>, prefix = ""): string[] => {
  const out: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isMessageTree(value)) {
      out.push(...flatten(value, path));
    } else {
      out.push(path);
    }
  }
  return out;
};

const splitTopLevel = (str: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of str) {
    if ("([{".includes(ch)) depth++;
    if (")]}".includes(ch)) depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
};

const STRING_ARG = /^(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')$/;

const parseLiteral = (raw?: string): NamespaceBinding => {
  if (!raw) return { kind: "root", value: "" };
  const quote = raw[0];
  const inner = raw.slice(1, -1);
  if (quote === "`") {
    const idx = inner.indexOf("${");
    if (idx === -1) return { kind: "static", value: inner };
    return { kind: "dynamic", value: inner.slice(0, idx).replace(/\.$/, "") };
  }
  return { kind: "static", value: inner };
};

const join2 = (a: string, b: string): string => (!b ? a : a ? `${a}.${b}` : b);

const findNamespaceBindings = (
  source: string,
): Map<string, NamespaceBinding[]> => {
  const bindings = new Map<string, NamespaceBinding[]>();
  const add = (name: string, info: NamespaceBinding) => {
    const current = bindings.get(name) ?? [];
    current.push(info);
    bindings.set(name, current);
  };

  const single =
    /\b(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')?\s*\)/g;
  for (const m of source.matchAll(single)) {
    if (m[1]) add(m[1], parseLiteral(m[2]));
  }

  const destructured =
    /const\s*\[([^\]]+)\]\s*=\s*await\s*Promise\.all\(\s*\[([\s\S]+?)\]\s*\)/g;
  for (const m of source.matchAll(destructured)) {
    if (!m[1] || !m[2]) continue;
    const names = splitTopLevel(m[1]);
    const exprs = splitTopLevel(m[2]);
    names.forEach((name, i) => {
      const expr = exprs[i];
      if (!expr) return;
      const call = expr.match(
        /^(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')?\s*\)$/,
      );
      if (call) add(name, parseLiteral(call[1]));
    });
  }

  return bindings;
};

const checkNestedApp = (app: AppConfig): CheckResult => {
  const rawBase = readMessages(app);
  const baseKeys = flatten(rawBase);
  const topLevelNamespaces = Object.keys(rawBase);
  const files = app.srcDirs.flatMap(walk);

  const usedExact = new Set<string>();
  const usedPrefixes = new Set<string>();
  const usedMissingFromBase = new Set<string>();

  for (const file of files) {
    const source = readFileSync(join(ROOT, file), "utf-8");

    if (source.includes("getMessages(")) {
      for (const ns of topLevelNamespaces) {
        if (source.includes(`"${ns}"`) || source.includes(`'${ns}'`))
          usedPrefixes.add(ns);
      }
    }

    const bindings = findNamespaceBindings(source);

    for (const [varName, namespaces] of bindings) {
      for (const ns of namespaces) {
        if (ns.kind === "dynamic") {
          usedPrefixes.add(ns.value);
          continue;
        }
        const nsPrefix = ns.value;

        const call = new RegExp(
          `\\b${varName}(?:\\.(?:rich|raw|markup|has))?\\(\\s*(${STRING_ARG.source.slice(1, -1)})?`,
          "g",
        );
        for (const m of source.matchAll(call)) {
          if (!m[1]) {
            usedPrefixes.add(nsPrefix);
            continue;
          }
          const key = parseLiteral(m[1]);
          if (key.kind === "dynamic") {
            usedPrefixes.add(join2(nsPrefix, key.value));
          } else {
            const full = join2(nsPrefix, key.value);
            usedExact.add(full);
            if (!baseKeys.includes(full)) usedMissingFromBase.add(full);
          }
        }
      }
    }
  }

  const isUsed = (key: string): boolean => {
    if (usedExact.has(key)) return true;
    for (const prefix of usedPrefixes) {
      if (key === prefix || key.startsWith(`${prefix}.`)) return true;
    }
    return false;
  };

  const allSource = files
    .map((f) => readFileSync(join(ROOT, f), "utf-8"))
    .join("\n");
  const unusedKeys = baseKeys.filter(
    (key) =>
      !isUsed(key) &&
      !allSource.includes(`"${key}"`) &&
      !allSource.includes(`'${key}'`),
  );

  return { unusedKeys, usedMissingFromBase: [...usedMissingFromBase] };
};

const checkFlatApp = (app: AppConfig): CheckResult => {
  const baseKeys = Object.keys(readMessages(app));
  const files = app.srcDirs.flatMap(walk);
  const allSource = files
    .map((f) => readFileSync(join(ROOT, f), "utf-8"))
    .join("\n");

  const dynamicPrefixes: string[] = [];
  for (const m of allSource.matchAll(/\bt\(\s*`([^`$]*)\$\{/g)) {
    if (m[1]) dynamicPrefixes.push(m[1]);
  }

  const unusedKeys = baseKeys.filter(
    (key) =>
      !allSource.includes(`"${key}"`) &&
      !allSource.includes(`'${key}'`) &&
      !allSource.includes(`\`${key}\``) &&
      !dynamicPrefixes.some((prefix) => key.startsWith(prefix)),
  );

  return { unusedKeys, usedMissingFromBase: [] };
};

let hasFailure = false;

for (const app of APPS) {
  const result =
    app.mode === "nested" ? checkNestedApp(app) : checkFlatApp(app);

  if (
    result.unusedKeys.length === 0 &&
    result.usedMissingFromBase.length === 0
  ) {
    console.log(`[${app.name}] OK - every message key is used.`);
    continue;
  }

  hasFailure = true;
  console.log(`[${app.name}] FAILED`);
  if (result.unusedKeys.length > 0) {
    console.log(`  Unused keys (defined in ${app.base} but never referenced):`);
    for (const key of result.unusedKeys) console.log(`    - ${key}`);
  }
  if (result.usedMissingFromBase.length > 0) {
    console.log(`  Referenced in code but missing from ${app.base}:`);
    for (const key of result.usedMissingFromBase) console.log(`    - ${key}`);
  }
}

if (hasFailure) {
  console.log(
    "\ni18n check failed - remove unused keys or add the missing ones.",
  );
  process.exit(1);
}
