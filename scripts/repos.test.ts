import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("./repos.ts", import.meta.url));
const gitEnv = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_AUTHOR_NAME: "test",
  GIT_AUTHOR_EMAIL: "test@example.com",
  GIT_COMMITTER_NAME: "test",
  GIT_COMMITTER_EMAIL: "test@example.com"
};

const git = (cwd: string, ...args: string[]): string => {
  const result = spawnSync("git", ["-c", "init.defaultBranch=stable", "-c", "protocol.file.allow=always", ...args], { cwd, env: gitEnv, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};

/** Creates bare `sdk`, `cli` and `presences` remotes plus an empty monorepo. */
const fixture = (): { remotes: string; root: string; cleanup: () => void } => {
  const base = mkdtempSync(join(tmpdir(), "nowly-repos-"));
  const remotes = join(base, "remotes");
  const root = join(base, "nowly");

  for (const name of ["sdk", "cli", "presences"]) {
    const work = join(base, `${name}-work`);
    git(base, "init", "-q", work);
    writeFileSync(join(work, "README.md"), name);
    git(work, "add", ".");
    git(work, "commit", "-qm", "init");
    git(base, "clone", "-q", "--bare", work, join(remotes, `${name}.git`));
  }

  git(base, "init", "-q", root);
  writeFileSync(join(root, "README.md"), "nowly");
  git(root, "add", ".");
  git(root, "commit", "-qm", "init");

  return { remotes, root, cleanup: () => rmSync(base, { recursive: true, force: true }) };
};

const run = (root: string, remotes: string, args: string[] = [], env: Record<string, string> = {}) =>
  spawnSync(process.execPath, ["--experimental-strip-types", script, ...args], {
    env: { ...gitEnv, CI: "", NOWLY_SKIP_REPOS: "", NOWLY_REPOS_ROOT: root, NOWLY_REPOS_BASE_URL: `file://${remotes}`, ...env },
    encoding: "utf8"
  });

test("clones the public repositories into packages/", () => {
  const { remotes, root, cleanup } = fixture();

  try {
    const result = run(root, remotes);
    assert.equal(result.status, 0, result.stderr);

    for (const name of ["sdk", "cli", "presences"]) {
      assert.equal(readFileSync(join(root, "packages", name, "README.md"), "utf8"), name);
    }
    assert.equal(existsSync(join(root, "packages", "internal-cli")), false);
  } finally {
    cleanup();
  }
});

test("converts a former submodule checkout into a standalone repository", () => {
  const { remotes, root, cleanup } = fixture();

  try {
    git(root, "submodule", "add", "-q", `file://${remotes}/sdk.git`, "packages/sdk");
    git(root, "commit", "-qm", "add submodule");
    git(root, "rm", "-q", "--cached", "packages/sdk");
    writeFileSync(join(root, "packages", "sdk", "README.md"), "local change");

    const result = run(root, remotes);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /packages\/sdk: former submodule converted/);

    const sdk = join(root, "packages", "sdk");
    assert.equal(statSync(join(sdk, ".git")).isDirectory(), true);
    assert.equal(existsSync(join(root, ".git", "modules", "packages", "sdk")), false);
    assert.equal(git(sdk, "rev-parse", "--show-toplevel"), sdk);
    assert.equal(git(sdk, "status", "--porcelain"), "M README.md");
  } finally {
    cleanup();
  }
});

test("leaves the monorepo index alone when run from a git hook", () => {
  const { remotes, root, cleanup } = fixture();

  try {
    const index = git(root, "ls-files", "--stage");
    const result = run(root, remotes, [], { GIT_DIR: join(root, ".git"), GIT_INDEX_FILE: join(root, ".git", "index"), GIT_WORK_TREE: root });
    assert.equal(result.status, 0, result.stderr);

    assert.equal(git(root, "ls-files", "--stage"), index);
    assert.equal(git(join(root, "packages", "presences"), "rev-parse", "--show-toplevel"), join(root, "packages", "presences"));
  } finally {
    cleanup();
  }
});

test("leaves the monorepo index alone when run from a git hook", () => {
  const { remotes, root, cleanup } = fixture();

  try {
    const index = git(root, "ls-files", "--stage");
    const result = run(root, remotes, [], { GIT_DIR: join(root, ".git"), GIT_INDEX_FILE: join(root, ".git", "index"), GIT_WORK_TREE: root });
    assert.equal(result.status, 0, result.stderr);

    assert.equal(git(root, "ls-files", "--stage"), index);
    assert.equal(git(join(root, "packages", "presences"), "rev-parse", "--show-toplevel"), join(root, "packages", "presences"));
  } finally {
    cleanup();
  }
});

test("--auto does nothing in CI", () => {
  const { remotes, root, cleanup } = fixture();

  try {
    const result = run(root, remotes, ["--auto"], { CI: "true" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(root, "packages")), false);
  } finally {
    cleanup();
  }
});
