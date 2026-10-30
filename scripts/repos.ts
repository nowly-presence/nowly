#!/usr/bin/env node
// Clones the separate Nowly repositories into packages/ for local work. They are
// git-ignored and excluded from the pnpm workspace, so each keeps its own history,
// lockfile and pull requests. Former submodule checkouts are turned into standalone
// repositories in place, without touching their files.
//
//   pnpm repos           clone missing repositories, migrate former submodules
//   pnpm repos --pull    also fast-forward every clean repository
//   --auto               used by `prepare`: silent no-op in CI, Docker or with NOWLY_SKIP_REPOS=1
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

const ROOT = resolve(process.env.NOWLY_REPOS_ROOT ?? join(import.meta.dirname, ".."));
const BASE_URL = (process.env.NOWLY_REPOS_BASE_URL ?? "https://github.com/nowly-presence").replace(/\/$/, "");

/** Public repositories cloned on demand. */
const CLONED = ["sdk", "cli", "presences"];
/** Private repository: never cloned, but a former submodule checkout is still migrated. */
const MIGRATED_ONLY = ["internal-cli"];

const args = new Set(process.argv.slice(2));
const auto = args.has("--auto");
const pull = args.has("--pull");

const git = (cwd: string, ...gitArgs: string[]) => spawnSync("git", gitArgs, { cwd, encoding: "utf8" });

const log = (message: string): void => console.log(`[repos] ${message}`);

/** Moves `.git/modules/<path>` back into the checkout when `.git` is a submodule gitfile. */
const detachFormerSubmodule = (dir: string): boolean => {
  const gitPath = join(dir, ".git");

  if (!existsSync(gitPath) || !statSync(gitPath).isFile()) return false;

  const match = readFileSync(gitPath, "utf8").match(/^gitdir:\s*(.+)$/m);

  if (!match) return false;

  const gitDir = isAbsolute(match[1].trim()) ? match[1].trim() : resolve(dir, match[1].trim());

  if (relative(join(ROOT, ".git", "modules"), gitDir).startsWith("..") || !existsSync(gitDir)) return false;

  // core.worktree is relative to the old location: drop it before moving the directory.
  git(dir, "config", "--file", join(gitDir, "config"), "--unset", "core.worktree");
  rmSync(gitPath);
  renameSync(gitDir, gitPath);

  return true;
};

const syncRepository = (name: string, clone: boolean): void => {
  const dir = join(ROOT, "packages", name);
  const label = `packages/${name}`;

  if (existsSync(join(dir, ".git"))) {
    if (detachFormerSubmodule(dir)) log(`${label}: former submodule converted to a standalone repository`);
    if (auto) return;

    if (pull) {
      const dirty = git(dir, "status", "--porcelain").stdout.trim();
      const result = dirty ? null : git(dir, "pull", "--ff-only");

      if (dirty) log(`${label}: local changes, not pulled`);
      else if (result?.status !== 0) log(`${label}: pull failed\n${result?.stderr.trim()}`);
    }

    const branch = git(dir, "branch", "--show-current").stdout.trim() || "detached HEAD";
    log(`${label}: ${branch}`);
    return;
  }

  if (!clone) return;

  if (existsSync(dir) && readdirSync(dir).length > 0) {
    log(`${label}: exists without .git, skipped`);
    return;
  }

  log(`${label}: cloning ${BASE_URL}/${name}.git`);
  // Blobless clone: full history, file contents downloaded on demand (presence assets are large).
  const result = spawnSync("git", ["clone", "--quiet", "--filter=blob:none", `${BASE_URL}/${name}.git`, dir], { stdio: "inherit" });

  if (result.status !== 0) throw new Error(`could not clone ${name}`);
};

const skipAuto = (): boolean => Boolean(process.env.CI || process.env.NOWLY_SKIP_REPOS) || !existsSync(join(ROOT, ".git"));

if (!(auto && skipAuto())) {
  try {
    for (const name of CLONED) syncRepository(name, true);
    for (const name of MIGRATED_ONLY) syncRepository(name, false);
  } catch (error) {
    log(error instanceof Error ? error.message : String(error));
    // Never break `pnpm install` because a clone failed; `pnpm repos` reports it.
    if (!auto) process.exitCode = 1;
  }
}
