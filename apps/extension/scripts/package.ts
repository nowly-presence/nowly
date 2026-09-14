import { execFileSync } from "child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";
import { zipSync } from "fflate";

type Browser = "chrome" | "firefox";
type PackageTarget = Browser | "all";

interface ExtensionManifest {
  version: string;
}

const browsers = ["chrome", "firefox"] as const;
const target = (process.argv[2] ?? "all") as PackageTarget;
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const repoRoot = join(root, "..", "..");
const distRoot = join(root, "dist");
const artifactsDir = join(root, "artifacts");

if (target !== "all" && !browsers.includes(target)) {
  throw new Error(`Unknown package target "${target}". Use chrome, firefox, or all.`);
}

const selectedBrowsers: readonly Browser[] = target === "all" ? browsers : [target];

const readManifest = (browser: Browser): ExtensionManifest => {
  const manifestPath = join(distRoot, browser, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as Partial<ExtensionManifest>;

  if (typeof manifest.version !== "string" || manifest.version.trim() === "") {
    throw new Error(`Missing extension version in ${manifestPath}.`);
  }

  return { version: manifest.version };
};

const runPnpmCommand = (command: string): void => {
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/d", "/s", "/c", command], {
      cwd: repoRoot,
      stdio: "inherit",
    });
    return;
  }

  execFileSync("sh", ["-c", command], {
    cwd: repoRoot,
    stdio: "inherit",
  });
};

const runBuild = (browser: Browser): void => {
  runPnpmCommand(`pnpm --filter @nowly/extension build:${browser}`);
};

const collectZipEntries = (dir: string, root: string): Record<string, Uint8Array> => {
  const entries: Record<string, Uint8Array> = {};

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(entries, collectZipEntries(fullPath, root));
      continue;
    }

    // AMO rejects Windows backslash paths (e.g. icons\icon128.png).
    const posixPath = relative(root, fullPath).replaceAll("\\", "/");
    entries[posixPath] = new Uint8Array(readFileSync(fullPath));
  }

  return entries;
};

const createZip = (sourceDir: string, outputPath: string): void => {
  rmSync(outputPath, { force: true });
  writeFileSync(outputPath, zipSync(collectZipEntries(sourceDir, sourceDir), { level: 9 }));
};

const packageBrowser = (browser: Browser): void => {
  runBuild(browser);
  mkdirSync(artifactsDir, { recursive: true });

  const manifest = readManifest(browser);
  const artifactPath = join(artifactsDir, `nowly-${browser}-v${manifest.version}.zip`);

  createZip(join(distRoot, browser), artifactPath);
  process.stdout.write(`Packaged ${browser}: ${relative(root, artifactPath)}\n`);
};

for (const browser of selectedBrowsers) {
  packageBrowser(browser);
}
