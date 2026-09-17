#!/usr/bin/env node
// Fails the build if an i18n message key is defined but never referenced in code,
// or referenced in code but missing from the base locale file.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();

const APPS = [
  { name: "web", mode: "nested", messagesDir: "apps/web/messages", base: "en-US.json", srcDirs: ["apps/web/app", "apps/web/components", "apps/web/lib", "apps/web/hooks"] },
  { name: "docs", mode: "nested", messagesDir: "apps/docs/messages", base: "en-US.json", srcDirs: ["apps/docs/app", "apps/docs/components", "apps/docs/lib", "apps/docs/hooks"] },
  { name: "extension", mode: "flat", messagesDir: "apps/extension/messages", base: "en.json", srcDirs: ["apps/extension/src"] },
];

const SOURCE_EXT = new Set([".ts", ".tsx"]);

const walk = dir => {
  const abs = join(ROOT, dir);
  let entries;
  try {
    entries = readdirSync(abs, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const rel = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") continue;
      files.push(...walk(rel));
    } else if (SOURCE_EXT.has(extname(entry.name))) {
      files.push(rel);
    }
  }
  return files;
};

const flatten = (obj, prefix = "") => {
  const out = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out.push(...flatten(value, path));
    } else {
      out.push(path);
    }
  }
  return out;
};

// Splits `a, b(c, d), e` into ["a", "b(c, d)", "e"] respecting nesting depth.
const splitTopLevel = str => {
  const parts = [];
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

// A static string -> { kind: "static", value }. A template with a static prefix
// before the first interpolation -> { kind: "dynamic", value: prefix }, meaning
// "any key under this prefix should be treated as used" since we can't resolve
// the interpolated part statically.
const parseLiteral = raw => {
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

const join2 = (a, b) => (!b ? a : a ? `${a}.${b}` : b);

const findNamespaceBindings = source => {
  const bindings = new Map(); // varName -> [{kind, value}]
  const add = (name, info) => {
    if (!bindings.has(name)) bindings.set(name, []);
    bindings.get(name).push(info);
  };

  const single = /\b(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')?\s*\)/g;
  for (const m of source.matchAll(single)) {
    add(m[1], parseLiteral(m[2]));
  }

  const destructured = /const\s*\[([^\]]+)\]\s*=\s*await\s*Promise\.all\(\s*\[([\s\S]+?)\]\s*\)/g;
  for (const m of source.matchAll(destructured)) {
    const names = splitTopLevel(m[1]);
    const exprs = splitTopLevel(m[2]);
    names.forEach((name, i) => {
      const expr = exprs[i];
      if (!expr) return;
      const call = expr.match(/^(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')?\s*\)$/);
      if (call) add(name, parseLiteral(call[1]));
    });
  }

  return bindings;
};

const checkNestedApp = app => {
  const rawBase = JSON.parse(readFileSync(join(ROOT, app.messagesDir, app.base), "utf-8"));
  const baseKeys = flatten(rawBase);
  const topLevelNamespaces = Object.keys(rawBase);
  const files = app.srcDirs.flatMap(walk);

  const usedExact = new Set();
  const usedPrefixes = new Set();
  const usedMissingFromBase = new Set();

  for (const file of files) {
    const source = readFileSync(join(ROOT, file), "utf-8");

    // `getMessages()` reads the whole message tree and indexes into it dynamically
    // (e.g. a Record<string, string> mapping a prop to a namespace name). We can't
    // trace that statically, so any top-level namespace name literally present in
    // the file is treated as fully used.
    if (source.includes("getMessages(")) {
      for (const ns of topLevelNamespaces) {
        if (source.includes(`"${ns}"`) || source.includes(`'${ns}'`)) usedPrefixes.add(ns);
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

        const call = new RegExp(`\\b${varName}(?:\\.(?:rich|raw|markup|has))?\\(\\s*(${STRING_ARG.source.slice(1, -1)})?`, "g");
        for (const m of source.matchAll(call)) {
          if (!m[1]) {
            // Non-literal argument (identifier/expression): can't resolve the key,
            // so treat the whole namespace as used rather than risk a false positive.
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

  const isUsed = key => {
    if (usedExact.has(key)) return true;
    for (const prefix of usedPrefixes) {
      if (key === prefix || key.startsWith(`${prefix}.`)) return true;
    }
    return false;
  };

  const allSource = files.map(f => readFileSync(join(ROOT, f), "utf-8")).join("\n");
  const unusedKeys = baseKeys.filter(key => !isUsed(key) && !allSource.includes(`"${key}"`) && !allSource.includes(`'${key}'`));

  return { unusedKeys, usedMissingFromBase: [...usedMissingFromBase] };
};

const checkFlatApp = app => {
  const baseKeys = Object.keys(JSON.parse(readFileSync(join(ROOT, app.messagesDir, app.base), "utf-8")));
  const files = app.srcDirs.flatMap(walk);
  const allSource = files.map(f => readFileSync(join(ROOT, f), "utf-8")).join("\n");

  // Dynamic keys like t(`theme-${key}`): treat the static prefix before the
  // interpolation as covering every base key that starts with it.
  const dynamicPrefixes = [];
  for (const m of allSource.matchAll(/\bt\(\s*`([^`$]*)\$\{/g)) {
    if (m[1]) dynamicPrefixes.push(m[1]);
  }

  const unusedKeys = baseKeys.filter(key =>
    !allSource.includes(`"${key}"`) &&
    !allSource.includes(`'${key}'`) &&
    !allSource.includes(`\`${key}\``) &&
    !dynamicPrefixes.some(prefix => key.startsWith(prefix)));

  return { unusedKeys, usedMissingFromBase: [] };
};

let hasFailure = false;

for (const app of APPS) {
  const result = app.mode === "nested" ? checkNestedApp(app) : checkFlatApp(app);

  if (result.unusedKeys.length === 0 && result.usedMissingFromBase.length === 0) {
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
  console.log("\ni18n check failed - remove unused keys or add the missing ones.");
  process.exit(1);
}
