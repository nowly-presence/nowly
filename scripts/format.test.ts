import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import * as prettier from "prettier";
import lintStaged from "lint-staged";
import { parsers } from "prettier/plugins/typescript";
import { printers } from "prettier/plugins/estree";
import {
  createProjectStylePlugin,
  projectFormattingOptions,
  projectStylePlugin,
} from "./format-style.ts";

const format = (
  source: string,
  filepath = "example.ts",
  options: prettier.Options = {},
): Promise<string> =>
  prettier.format(source, {
    ...projectFormattingOptions,
    ...options,
    filepath,
    plugins: [projectStylePlugin],
  });

const normalizeAst = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeAst);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) =>
          !key.startsWith("__") &&
          ![
            "range",
            "loc",
            "start",
            "end",
            "raw",
            "extra",
            "tokens",
            "comments",
            "parenthesized",
            "leadingComments",
            "trailingComments",
          ].includes(key),
      )
      .map(([key, child]) => [key, normalizeAst(child)]),
  );
};

const assertSameSyntax = async (
  before: string,
  after: string,
  filepath = "example.ts",
): Promise<void> => {
  const parse = async (source: string): Promise<unknown> =>
    normalizeAst(
      await parsers.typescript.parse(
        await prettier.format(source, { filepath, objectWrap: "collapse" }),
        { filepath } as prettier.ParserOptions,
      ),
    );
  assert.deepEqual(await parse(after), await parse(before));
};

const assertStable = async (
  source: string,
  filepath = "example.ts",
): Promise<string> => {
  const formatted = await format(source, filepath);
  assert.equal(await format(formatted, filepath), formatted);
  await assertSameSyntax(source, formatted, filepath);
  return formatted;
};

test("expands object unions and return types without breaking function signatures", async () => {
  const source =
    "type Outcome = { ok: true; value: string } | { ok: false; error: string }; const resolve = async (current: string, data: string | undefined): Promise<{ value: string; skipped: boolean }> => { if (!data) return {value: current, skipped: true}; return {value: data, skipped: false}; };";
  const result = await assertStable(source);
  assert.match(
    result,
    /type Outcome = \{\n  ok: true;\n  value: string;\n\} \| \{\n  ok: false;\n  error: string;\n\};/u,
  );
  assert.match(
    result,
    /const resolve = async \(current: string, data: string \| undefined\): Promise<\{\n/u,
  );
  assert.match(
    result,
    /if \(!data\) return \{\n    value: current,\n    skipped: true\n  \};\n\n  return/u,
  );
});

test("expands nested payloads and operation arrays, but keeps small values compact", async () => {
  const result = await assertStable(
    'const load = async () => { const [large, small] = await Promise.all([resolveImage(a), resolveImage(b)]); const result = await send("SAVE", { draft: { ...draft, largeImage: large.image, smallImage: small.image } }); return { result, large, small }; };',
  );
  assert.match(
    result,
    /Promise\.all\(\[\n    resolveImage\(a\),\n    resolveImage\(b\)\n  \]\);\n\n/u,
  );
  assert.match(
    result,
    /send\("SAVE", \{\n    draft: \{\n      \.\.\.draft,\n      largeImage: large.image,\n      smallImage: small.image\n    \}\n  \}\)/u,
  );
  assert.match(result, /return \{ result, large, small \};/u);
  const compact = await assertStable(
    'const keys = ["one", "two"]; send("GET", { hashes }); const f = () => ok ? { ok: true, value } : { ok: false, error };',
  );
  assert.match(compact, /\["one", "two"\]/u);
  assert.match(compact, /send\("GET", \{ hashes \}\)/u);
  assert.match(
    compact,
    /ok \? \{ ok: true, value \} : \{ ok: false, error \}/u,
  );
});

test("keeps imports and hook dependencies compact", async () => {
  const source =
    'import { CUSTOM_ACTIVITY_FILE_MAX_BYTES, activityFileName, buildActivityFile, parseActivityFile, type ActivityFileError, type ParsedActivityFile } from "@/shared/custom-activity-share"; const callback = useCallback(async ({draft, images}: ParsedActivityFile): Promise<void> => { await save({draft,images}); }, [refresh, toast, state.items.length]);';
  const result = await assertStable(source);
  assert.equal(result.split("\n")[0], source.split("; ")[0] + ";");
  assert.match(
    result,
    /useCallback\(async \(\{ draft, images \}: ParsedActivityFile\): Promise<void> => \{/u,
  );
  assert.match(result, /\}, \[refresh, toast, state.items.length\]\);/u);
});

test("splits instructions, catch/finally blocks and long ternaries", async () => {
  const source =
    'const run = () => { try { send(); save(); } catch { toast("error"); } finally { pending.current = false; setPending(false); } toast(imported.length === 1 ? t("custom.toast.imported", { name: imported[0].activity.name }) : t("custom.toast.importedMany", { count: imported.length })); };';
  const result = await assertStable(source);
  assert.match(result, /send\(\);\n    save\(\);/u);
  assert.match(
    result,
    /\} catch \{\n    toast\("error"\);\n  \} finally \{\n    pending.current = false;\n    setPending\(false\);\n  \}/u,
  );
  assert.match(
    result,
    /imported.length === 1\n\s+\? t\("custom.toast.imported"/u,
  );
});

test("separates logical stages without spacing every simple instruction", async () => {
  const result = await assertStable(
    'const run = async () => { if (pending) return; const files = input.filter(isJson); if (!files.length) { toast("empty"); return; } pending = true; setPending(true); try { const result = await load(); save(result); if (result.ok) count += 1; } finally { pending = false; setPending(false); } };',
  );
  assert.match(result, /if \(pending\) return;\n\n  const files/u);
  assert.match(result, /pending = true;\n  setPending\(true\);\n\n  try/u);
  assert.match(
    result,
    /const result = await load\(\);\n    save\(result\);\n    if \(result.ok\) count \+= 1;/u,
  );
});

test("preserves comments, directives and ignored source", async () => {
  const source =
    '// header\nimport { a, /* import marker */ b } from "lib";\n// type marker\ntype Result = { /* property marker */ ok: true; value: string } | { ok: false };\nconst run = () => {\n  // @ts-expect-error intentional fixture\n  if (missing) return { ok: false, value: "" }; // trailing marker\n  // next marker\n  return { ok: true, value: "/* literal */" };\n};\n// prettier-ignore\nconst ignored={first:1,second:2};';
  const result = await assertStable(source);
  for (const comment of [
    "header",
    "import marker",
    "type marker",
    "property marker",
    "@ts-expect-error intentional fixture",
    "trailing marker",
    "next marker",
    "prettier-ignore",
  ]) {
    assert.equal(result.split(comment).length, 2, comment);
  }
  assert.match(result, /const ignored=\{first:1,second:2\};/u);
  assert.match(result, /"\/\* literal \*\/"/u);
});

test("preserves line comments inside imports, unions, conditions and callbacks", async () => {
  const source =
    'import {\n  // import comment\n  a, b\n} from "lib";\ntype R =\n// union comment\n{ ok: true } | { ok: false };\nconst cb = useCallback(\n// callback comment\n() => { if (\n// condition comment\na) return b; }, [a]);';
  const result = await assertStable(source);
  for (const comment of [
    "import comment",
    "union comment",
    "callback comment",
    "condition comment",
  ]) {
    assert.equal(result.split(comment).length, 2, comment);
  }
});

test("preserves precedence, optional calls, generics, spreads and sparse arrays", async () => {
  const fixtures = [
    'const f = async () => { const a = (await load()) ?? {}; return condition ? {ok: true, value: a} : {ok: false, error: "error"}; };',
    "declare type Result<T extends object> = {ok:true;value:T} | {ok:false}; const cb = useCallback<Result<Item>>(() => { return {ok:true,value:item}; }, [item]);",
    'const cb = useCallback?.(() => { return {value: "x", ok:true}; }, []); const f = () => ({a:1,b:2}); const sparse = [load(), , save(), ...items];',
    "const choose = (a: boolean) => { if (a) if (b) return {a: 1, b: 2}; else return {a: 2, b: 1}; return {a,b}; };",
    "const f = ({a, b}: {a:string;b:number}): {ok:boolean;value:string} => { return {ok:true,value:a}; };",
    'const f = (input: string) => { if (input) /* keep */ return {ok:true,value:input}; return {ok:false,value:""}; };',
  ];
  for (const source of fixtures) await assertStable(source);
});

test("preserves parentheses around object unions in nested type expressions", async () => {
  const fixtures = [
    "type ChartConfig = Record<string, { label?: React.ReactNode; icon?: React.ComponentType } & ({ color?: string; theme?: never } | { color?: never; theme: Record<string, string> })>;",
    "type Result = ({ ok: true; value: string } | { ok: false; error: string }) & { id: string };",
    "type Results = ({ ok: true; value: string } | { ok: false; error: string })[];",
    "type Keys = keyof ({ first: string } | { second: number });",
    'type Value = ({ value: string } | { value: number })["value"];',
    "type Tuple = [({ first: string } | { second: number })?];",
  ];
  for (const source of fixtures) await assertStable(source);
});

test("preserves TSX, generic arrows and significant JSX text", async () => {
  const source =
    "const identity = <T,>(value: T): T => { return value; }; const View = ({name}: {name: string}) => { const click = useCallback(() => { send({name,enabled:true}); }, [name]); return <section onClick={click}>Hello <strong>{name}</strong> world{ok ? <span> yes </span> : null}</section>; };";
  const result = await assertStable(source, "example.tsx");
  assert.match(result, /<T,>\(value: T\): T =>/u);
  assert.match(result, /Hello /u);
  assert.match(result, / world/u);
});

test("expands returned JSX providers and fragments with children", async () => {
  const provider = await assertStable(
    "const View = () => { return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>; };",
    "example.tsx",
  );
  assert.equal(
    provider,
    [
      "const View = () => {",
      "  return (",
      "    <SeasonContext.Provider value={value}>",
      "      {children}",
      "    </SeasonContext.Provider>",
      "  );",
      "};",
      "",
    ].join("\n"),
  );

  const fragment = await assertStable(
    "const View = () => { return <>{children}</>; };",
    "example.tsx",
  );
  assert.match(
    fragment,
    /return \(\n    <>\n      \{children\}\n    <\/>\n  \);/u,
  );
});

test("expands returned JSX without changing meaningful text, comments or ignored code", async () => {
  const fixtures = [
    "const View = () => { return <div>{children}</div>; };",
    "const View = () => { return <p>Hello</p>; };",
    "const View = () => { return <p> </p>; };",
    "const View = () => { return <p> Hello <strong>{name}</strong> world </p>; };",
    "const View = () => { return <div>{/* child marker */}{children}</div>; };",
    "const View = () => { return /* return marker */ <div>{children}</div>; };",
    "const View = () => { return <div data-value={{first: 1, second: 2}}>{children}</div>; };",
    "const View = () => { if (ready) return <div>{children}</div>; return null; };",
  ];
  for (const source of fixtures) {
    const result = await assertStable(source, "example.tsx");
    assert.match(result, /return(?: \/\* return marker \*\/)? \(/u);
    for (const marker of ["child marker", "return marker"]) {
      if (source.includes(marker)) assert.equal(result.split(marker).length, 2);
    }
  }
  const ignored =
    "const View = () => {\n// prettier-ignore\nreturn <div>{children}</div>;\n};";
  assert.match(
    await assertStable(ignored, "example.tsx"),
    /return <div>\{children\}<\/div>;/u,
  );
});

test("keeps returned JSX without children compact and respects semicolon settings", async () => {
  const empty = await assertStable(
    "const View = () => { if (ready) return <Spinner />; return <div></div>; };",
    "example.tsx",
  );
  assert.match(empty, /if \(ready\) return <Spinner \/>;/u);
  assert.match(empty, /return <div><\/div>;/u);
  const result = await format(
    "const View = () => { return <div>{children}</div>; };",
    "example.tsx",
    { semi: false },
  );
  assert.match(
    result,
    /return \(\n    <div>\n      \{children\}\n    <\/div>\n  \)\n/u,
  );
  assert.doesNotMatch(result, /;/u);
});

test("respects configured quote, semicolon and newline options", async () => {
  const result = await format(
    'type R={a:string;b:number}; const f=()=>{return {a:"a",b:1};};',
    "example.ts",
    { semi: false, singleQuote: true, endOfLine: "crlf" },
  );
  assert.match(result, /a: 'a',\r\n/u);
  assert.doesNotMatch(result, /;/u);
  assert.doesNotMatch(result, /(?<!\r)\n/u);
});

test("composes configured parser preprocessors and printers", async () => {
  let printedNodes = 0;
  const configuredPlugin: prettier.Plugin = {
    parsers: {
      typescript: {
        ...parsers.typescript,
        preprocess: (source) => source.replace('"before"', '"after"'),
      },
    },
    printers: {
      estree: {
        ...printers.estree,
        print: (...args) => {
          printedNodes += 1;
          return printers.estree.print(...args);
        },
      },
    },
  };
  const result = await prettier.format(
    'const value = {ok: true, text: "before"};',
    {
      ...projectFormattingOptions,
      parser: "typescript",
      plugins: [configuredPlugin, createProjectStylePlugin([configuredPlugin])],
    },
  );
  assert.match(result, /text: "after"/u);
  assert.match(result, /\{\n  ok: true,/u);
  assert.ok(printedNodes > 0);
});

test("keeps simple destructuring and spread-only objects compact", async () => {
  const result = await assertStable(
    "const Component = ({children}: {children: ReactNode}) => { const patch = useCallback(() => { return {...current, value}; }, [value]); return children; };",
  );
  assert.match(
    result,
    /const Component = \(\{ children \}: \{\n  children: ReactNode;\n\}\) =>/u,
  );
  assert.match(result, /return \{ \.\.\.current, value \};/u);
});

const scriptPath = fileURLToPath(new URL("./format.ts", import.meta.url));
const runScript = (cwd: string, ...args: string[]) =>
  spawnSync(
    process.execPath,
    ["--experimental-strip-types", scriptPath, ...args],
    { cwd, encoding: "utf8" },
  );

const withProject = async (
  run: (directory: string) => Promise<void>,
): Promise<void> => {
  const directory = await mkdtemp(join(tmpdir(), "nowly-format-test-"));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};

const put = async (
  directory: string,
  path: string,
  content: string,
): Promise<void> => {
  await mkdir(dirname(join(directory, path)), { recursive: true });
  await writeFile(join(directory, path), content);
};

test("CLI rejects missing or conflicting modes without writing", async () =>
  withProject(async (directory) => {
    await put(directory, "apps/example/source.ts", "const value={a:1,b:2};");
    for (const args of [
      [],
      ["--check", "--write"],
      ["--write", "--dry-run"],
      ["--check", "--dry-run"],
    ]) {
      const result = runScript(directory, ...args, "apps/example/source.ts");
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Use exactly one formatting mode/u);
    }
    assert.equal(
      await readFile(join(directory, "apps/example/source.ts"), "utf8"),
      "const value={a:1,b:2};",
    );
  }));

test("CLI check and dry-run do not write; write is stable and removes final newlines", async () =>
  withProject(async (directory) => {
    const file = "apps/example/source.ts";
    const source = 'const run=()=>{return {ok:true,value:"yes"};};\n';
    await put(directory, file, source);
    const check = runScript(directory, "--check", file);
    assert.equal(check.status, 1, check.stderr);
    assert.match(check.stderr, /Formatting issues found in 1 file/u);
    const dryRun = runScript(directory, "--dry-run", file);
    assert.equal(dryRun.status, 0, dryRun.stderr);
    assert.match(dryRun.stdout, /1 file\(s\) would be formatted/u);
    assert.equal(await readFile(join(directory, file), "utf8"), source);
    const write = runScript(directory, "--write", file);
    assert.equal(write.status, 0, write.stderr);
    assert.match(write.stdout, /Formatted 1 file/u);
    const formatted = await readFile(join(directory, file), "utf8");
    assert.equal(formatted, (await format(source)).trimEnd());
    assert.doesNotMatch(formatted, /\r?\n$/u);
    assert.equal(runScript(directory, "--check", file).status, 0);
    assert.match(
      runScript(directory, "--write", file).stdout,
      /Formatted 0 file/u,
    );
    assert.match(
      runScript(directory, "--dry-run", file).stdout,
      /no files would be formatted/u,
    );
  }));

test("CLI preserves file selection and prettierignore exclusions", async () =>
  withProject(async (directory) => {
    const files = [
      "apps/example/source.ts",
      "packages/example/view.tsx",
      "packages/ui/src/components/button.tsx",
      "apps/example/ignored.ts",
      "scripts/example.ts",
      "apps/example/data.json",
    ];
    for (const file of files)
      await put(
        directory,
        file,
        file.endsWith("json") ? '{"a":1}' : "const value={a:1,b:2};",
      );
    await put(directory, ".prettierignore", "apps/example/ignored.ts\n");
    const result = runScript(
      directory,
      "--write",
      ...files,
      "apps/example/missing.ts",
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Formatted 2 file/u);
    for (const file of files.slice(2)) {
      assert.equal(
        await readFile(join(directory, file), "utf8"),
        file.endsWith("json") ? '{"a":1}' : "const value={a:1,b:2};",
      );
    }
  }));

test("CLI accepts absolute staged paths without changing exclusions", async () =>
  withProject(async (directory) => {
    const file = "apps/example/staged file.ts";
    const excluded = "packages/ui/src/components/button.tsx";
    await put(directory, file, "const value={a:1,b:2};");
    await put(directory, excluded, "const value={a:1,b:2};");
    const result = runScript(
      directory,
      "--write",
      join(directory, file),
      join(directory, excluded),
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Formatted 1 file/u);
    assert.equal(
      runScript(directory, "--check", join(directory, file)).status,
      0,
    );
    assert.equal(
      await readFile(join(directory, excluded), "utf8"),
      "const value={a:1,b:2};",
    );
  }));

test("CLI reads project configuration and configured plugins", async () =>
  withProject(async (directory) => {
    await put(
      directory,
      ".prettierrc.json",
      JSON.stringify({
        semi: false,
        singleQuote: true,
        plugins: ["./plugin.mjs"],
      }),
    );
    await put(
      directory,
      "plugin.mjs",
      `import { parsers } from ${JSON.stringify(import.meta.resolve("prettier/plugins/typescript"))};\nexport default {parsers: {typescript: {...parsers.typescript, preprocess: source => source.replace('"before"', '"after"')}}};`,
    );
    const file = "apps/example/source.ts";
    await put(directory, file, 'const value={ok:true,text:"before"};');
    const result = runScript(directory, "--write", file);
    assert.equal(result.status, 0, result.stderr);
    const formatted = await readFile(join(directory, file), "utf8");
    assert.match(formatted, /text: 'after'/u);
    assert.doesNotMatch(formatted, /;/u);
  }));

test("pre-commit formatting preserves unstaged changes and handles paths with spaces", async () =>
  withProject(async (directory) => {
    const git = (...args: string[]) => {
      const result = spawnSync("git", args, {
        cwd: directory,
        encoding: "utf8",
      });
      assert.equal(result.status, 0, result.stderr);
      return result.stdout;
    };
    git("init", "--quiet");
    const file = "apps/example/staged file.ts";
    const unchanged = Array.from(
      { length: 12 },
      (_, index) => `export const keep${index} = ${index};`,
    ).join("\n");
    const baseline = `export const staged = { a: 1 };\n\n${unchanged}\n\nexport const unstaged = 1;`;
    await put(directory, file, baseline);
    git("add", "--", file);
    git(
      "-c",
      "user.name=Format Test",
      "-c",
      "user.email=format@example.test",
      "commit",
      "--quiet",
      "-m",
      "fixture",
    );
    const staged = baseline.replace(
      "export const staged = { a: 1 };",
      "export const staged={a:2};",
    );
    await put(directory, file, staged);
    git("add", "--", file);
    await put(
      directory,
      file,
      staged.replace(
        "export const unstaged = 1;",
        "export const unstaged = 2;",
      ),
    );
    const untouched = "apps/example/not-staged.ts";
    await put(directory, untouched, "const untouched={a:1};");
    const executable = process.execPath.replaceAll("\\", "/");
    const formatter = scriptPath.replaceAll("\\", "/");
    const result = await lintStaged({
      cwd: directory,
      config: {
        "{apps,packages}/**/*.{ts,tsx}": `"${executable}" --experimental-strip-types "${formatter}" --write`,
      },
      quiet: true,
    });
    assert.equal(result, true);
    const indexed = git("show", `:${file}`);
    assert.equal(
      indexed,
      (await format(staged, file)).replace(/(?:\r?\n)+$/u, ""),
    );
    assert.match(indexed, /export const unstaged = 1;/u);
    assert.match(
      await readFile(join(directory, file), "utf8"),
      /export const unstaged = 2;/u,
    );
    assert.equal(
      await readFile(join(directory, untouched), "utf8"),
      "const untouched={a:1};",
    );
  }));

test("CLI excludes project submodules and protected files even when explicitly requested", async () =>
  withProject(async (directory) => {
    const ignoredFiles = [
      "packages/sdk/src/source.ts",
      "packages/presences/src/source.ts",
      "packages/cli/src/source.ts",
      "packages/internal-cli/src/source.ts",
      "apps/web/next-env.d.ts",
      "apps/extension/src/components/shared/nolo-mascot.tsx",
      "apps/extension/src/components/shared/nolo-paths.ts",
      "apps/extension/src/ui/streaming-text.tsx",
    ];
    await put(
      directory,
      ".prettierignore",
      await readFile(new URL("../.prettierignore", import.meta.url), "utf8"),
    );
    for (const file of ignoredFiles)
      await put(directory, file, "const value={a:1,b:2};");
    await put(directory, "apps/example/source.ts", "const value={a:1,b:2};");
    const result = runScript(
      directory,
      "--write",
      ...ignoredFiles,
      "apps/example/source.ts",
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Formatted 1 file/u);
    for (const file of ignoredFiles)
      assert.equal(
        await readFile(join(directory, file), "utf8"),
        "const value={a:1,b:2};",
      );
  }));

test("CLI discovers tracked and untracked non-ignored files through git", async () =>
  withProject(async (directory) => {
    assert.equal(
      spawnSync("git", ["init", "--quiet"], { cwd: directory }).status,
      0,
    );
    await put(directory, "apps/example/tracked.ts", "const tracked={a:1,b:2};");
    assert.equal(
      spawnSync("git", ["add", "apps/example/tracked.ts"], { cwd: directory })
        .status,
      0,
    );
    await put(
      directory,
      "packages/example/untracked.ts",
      "const untracked={a:1,b:2};",
    );
    await put(directory, "apps/example/ignored.ts", "const ignored={a:1,b:2};");
    await put(directory, ".gitignore", "apps/example/ignored.ts\n");
    const result = runScript(directory, "--write");
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Formatted 2 file/u);
    assert.equal(
      await readFile(join(directory, "apps/example/ignored.ts"), "utf8"),
      "const ignored={a:1,b:2};",
    );
  }));
