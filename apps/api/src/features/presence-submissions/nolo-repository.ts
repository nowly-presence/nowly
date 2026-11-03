import { GithubError, type GithubClient } from "@/shared/github-app";
import { serverEnv } from "@nowly/env/server";
import type { CreatorDefinition } from "@nowly/presence-creator";
import { z } from "zod";

const HTTP_NOT_FOUND = 404;
const HTTP_UNPROCESSABLE = 422;
const FILE_MODE = "100644";
const PR_LABELS = ["presence", "creator"];

export type TreeEntry = {
  path: string;
  mode: string;
  type: "blob";
  content?: string;
  sha?: string | null;
};

const ShaSchema = z.object({ sha: z.string() });
const RefSchema = z.object({ object: ShaSchema });
const CommitSchema = z.object({ tree: ShaSchema });
const ContentListSchema = z.array(
  z.object({
    path: z.string(),
    type: z.string()
  })
);
const PullSchema = z.object({
  number: z.number().int(),
  html_url: z.string().url()
});
const PullListSchema = z.array(PullSchema);

const repoPath = (path: string): string => `/repos/${serverEnv.NOLO_REPOSITORY}${path}`;

const encodePath = (path: string): string => path.split("/").map(encodeURIComponent).join("/");

const onBase = (path: string): string => repoPath(`/contents/${encodePath(path)}?ref=${encodeURIComponent(serverEnv.NOLO_BASE_BRANCH)}`);

const plain = (value: string): string => `\`${value.replace(/[`\r\n]/g, " ").trim()}\``;

const notFoundAs =
  <T>(fallback: T) =>
  (error: unknown): T => {
    if (error instanceof GithubError && error.status === HTTP_NOT_FOUND) return fallback;

    throw error;
  };

export const textEntry = (path: string, content: string): TreeEntry => ({
  path,
  mode: FILE_MODE,
  type: "blob",
  content
});

export const deletedEntry = (path: string): TreeEntry => ({
  path,
  mode: FILE_MODE,
  type: "blob",
  sha: null
});

export const fileExists = (github: GithubClient, path: string): Promise<boolean> => github("GET", onBase(path)).then(() => true, notFoundAs(false));

export const listFolderFiles = (github: GithubClient, path: string): Promise<string[]> =>
  github("GET", onBase(path)).then(
    (body) =>
      ContentListSchema.parse(body)
        .filter((item) => item.type === "file")
        .map((item) => item.path),
    notFoundAs<string[]>([])
  );

export const uploadBlob = async (github: GithubClient, path: string, bytes: Buffer): Promise<TreeEntry> => {
  const blob = ShaSchema.parse(
    await github("POST", repoPath("/git/blobs"), {
      content: bytes.toString("base64"),
      encoding: "base64"
    })
  );
  return {
    path,
    mode: FILE_MODE,
    type: "blob",
    sha: blob.sha
  };
};

export const commitOnBase = async (github: GithubClient, tree: TreeEntry[], message: string): Promise<string> => {
  const baseSha = RefSchema.parse(await github("GET", repoPath(`/git/ref/heads/${encodePath(serverEnv.NOLO_BASE_BRANCH)}`))).object.sha;
  const baseTree = CommitSchema.parse(await github("GET", repoPath(`/git/commits/${baseSha}`))).tree.sha;
  const treeSha = ShaSchema.parse(
    await github("POST", repoPath("/git/trees"), {
      base_tree: baseTree,
      tree
    })
  ).sha;
  return ShaSchema.parse(
    await github("POST", repoPath("/git/commits"), {
      message,
      tree: treeSha,
      parents: [baseSha]
    })
  ).sha;
};

export const pushBranch = async (github: GithubClient, branch: string, sha: string): Promise<void> => {
  await github("POST", repoPath("/git/refs"), {
    ref: `refs/heads/${branch}`,
    sha
  }).catch(async (error: unknown) => {
    if (!(error instanceof GithubError) || error.status !== HTTP_UNPROCESSABLE) throw error;

    await github("PATCH", repoPath(`/git/refs/heads/${encodePath(branch)}`), {
      sha,
      force: true
    });
  });
};

export const openOrReusePullRequest = async (github: GithubClient, input: {
  branch: string;
  title: string;
  body: string;
}) => {
  const [owner] = serverEnv.NOLO_REPOSITORY.split("/");
  const [open] = PullListSchema.parse(await github("GET", repoPath(`/pulls?state=open&head=${encodeURIComponent(`${owner}:${input.branch}`)}`)));

  if (open) return open;

  const created = PullSchema.parse(
    await github("POST", repoPath("/pulls"), {
      title: input.title,
      head: input.branch,
      base: serverEnv.NOLO_BASE_BRANCH,
      body: input.body,
      maintainer_can_modify: true
    })
  );
  await github("POST", repoPath(`/issues/${created.number}/labels`), { labels: PR_LABELS }).catch(() => undefined);
  return created;
};

export const pullRequestBody = (input: {
  submissionId: string;
  definition: CreatorDefinition;
  author: {
    name: string;
    discordId: string | null;
  };
}): string => {
  const { definition, author } = input;
  const credit = author.discordId ? `${plain(author.name)} ([Discord](https://discord.com/users/${author.discordId}))` : plain(author.name);
  return [
    `Presence sent from the Nowly creator: ${serverEnv.FRONTEND_URL.replace(/\/$/, "")}/requests/${input.submissionId}`,
    "",
    `Author: ${credit}`,
    `Domains: ${definition.domains.map(plain).join(", ")}`,
    `Pages: ${definition.pages.map((page) => plain(page.name)).join(", ")}`,
    "",
    "Files are generated by the server from the reviewed definition."
  ].join("\n");
};