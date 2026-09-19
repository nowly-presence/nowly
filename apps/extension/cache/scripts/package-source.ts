import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const repoRoot = join(root, "..", "..");
const artifactsDir = join(root, "artifacts");

const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf-8")) as { version: string };

// Tracked + new-but-not-gitignored files, read straight off disk so this
// captures the exact code that produced the build (not just the last commit).
const fileList = execSync("git ls-files --cached --others --exclude-standard", { cwd: repoRoot })
  .toString()
  .split("\n")
  .filter(Boolean);

const entries: Record<string, Uint8Array> = {};
for (const relativePath of fileList) {
  const fullPath = join(repoRoot, relativePath);
  if (!statSync(fullPath, { throwIfNoEntry: false })?.isFile()) continue;
  entries[relativePath] = new Uint8Array(readFileSync(fullPath));
}

mkdirSync(artifactsDir, { recursive: true });
const outputPath = join(artifactsDir, `nowly-source-v${manifest.version}.zip`);
writeFileSync(outputPath, zipSync(entries, { level: 9 }));
process.stdout.write(`Packaged source: ${fileList.length} files -> ${outputPath}\n`);
