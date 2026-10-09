import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import * as prettier from "prettier";

const isCheckMode = process.argv.includes("--check");
const isWriteMode = process.argv.includes("--write");
const isDryRunMode = process.argv.includes("--dry-run");
const requestedFiles = process.argv
  .slice(2)
  .filter(
    (argument) =>
      argument !== "--check" &&
      argument !== "--write" &&
      argument !== "--dry-run",
  );

const selectedModeCount = [isCheckMode, isWriteMode, isDryRunMode].filter(
  Boolean,
).length;

if (selectedModeCount !== 1) {
  process.stderr.write(
    "Use exactly one formatting mode: --check, --write, or --dry-run.\n",
  );
  process.exit(1);
}

const files = (requestedFiles.length > 0
  ? requestedFiles
  : execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { encoding: "utf8" },
    ).split("\0")
).filter((file) => {
  const normalizedFile = file.replaceAll("\\", "/");

  return (
    existsSync(file) &&
    /^(?:apps|packages)\/.+\.tsx?$/u.test(normalizedFile) &&
    !normalizedFile.startsWith("packages/ui/src/components/")
  );
});

const prettierConfig = (await prettier.resolveConfig(process.cwd())) ?? {};
const plugins = await Promise.all(
  (prettierConfig.plugins ?? []).map(async (plugin) => {
    if (typeof plugin !== "string") {
      return plugin;
    }

    const importedPlugin = await import(plugin);
    return importedPlugin.default ?? importedPlugin;
  }),
);
const formattingOptions: prettier.Options = { ...prettierConfig, plugins };
const unformattedFiles: string[] = [];
let formattedFileCount = 0;

const stripFinalNewlines = (content: string): string =>
  content.replace(/(?:\r?\n)+$/u, "");

for (const file of files) {
  const fileInfo = await prettier.getFileInfo(file, {
    ignorePath: ".prettierignore",
  });

  if (fileInfo.ignored || !fileInfo.inferredParser) {
    continue;
  }

  const source = await readFile(file, "utf8");
  const formatted = stripFinalNewlines(
    await prettier.format(source, { ...formattingOptions, filepath: file }),
  );

  if (source === formatted) {
    continue;
  }

  if (isCheckMode || isDryRunMode) {
    unformattedFiles.push(file);
    continue;
  }

  await writeFile(file, formatted, "utf8");
  formattedFileCount += 1;
}

if (isCheckMode && unformattedFiles.length > 0) {
  process.stderr.write(
    `Formatting issues found in ${unformattedFiles.length} file(s):\n`,
  );
  process.stderr.write(`${unformattedFiles.join("\n")}\n`);
  process.exit(1);
}

if (isCheckMode) {
  process.stdout.write("All matched files use the project formatting style.\n");
} else if (isDryRunMode) {
  if (unformattedFiles.length === 0) {
    process.stdout.write("Dry run complete: no files would be formatted.\n");
  } else {
    process.stdout.write(
      `Dry run complete: ${unformattedFiles.length} file(s) would be formatted:\n`,
    );
    process.stdout.write(`${unformattedFiles.join("\n")}\n`);
  }
} else {
  process.stdout.write(`Formatted ${formattedFileCount} file(s).\n`);
}
