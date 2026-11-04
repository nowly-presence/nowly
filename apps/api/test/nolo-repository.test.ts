import { removePresenceFolder } from "@/features/presence-submissions/nolo-repository";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const calls: Array<{
  method: string;
  path: string;
  body?: unknown;
}> = [];

const client = async (method: string, path: string, body?: unknown): Promise<unknown> => {
  calls.push({ method, path, body });

  if (path.includes("/git/ref/heads/")) return {
    object: { sha: "base" }
  };
  if (path.endsWith("/git/commits/base")) return {
    tree: { sha: "tree" }
  };
  if (path.includes("/git/trees/tree")) {
    return {
      tree: [
        {
          path: "src/G/Google/metadata.json",
          type: "blob"
        },
        {
          path: "src/G/Google/assets",
          type: "tree"
        },
        {
          path: "src/G/Google/assets/logo.png",
          type: "blob"
        },
        {
          path: "src/G/Google Maps/metadata.json",
          type: "blob"
        }
      ]
    };
  }
  if (path.endsWith("/git/trees")) return {
    sha: "new-tree"
  };
  if (path.endsWith("/git/commits")) return {
    sha: "commit"
  };

  return {};
};

beforeEach(() => {
  calls.length = 0;
  vi.stubEnv("NOLO_REPOSITORY", "org/presences");
  vi.stubEnv("NOLO_BASE_BRANCH", "stable");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("removePresenceFolder", () => {
  it("deletes every file of the matching folder on the base branch and nothing else", async () => {
    expect(await removePresenceFolder(client, "google")).toBe("removed");

    const tree = calls.find((call) => call.method === "POST" && call.path.endsWith("/git/trees"));
    expect(tree?.body).toMatchObject({
      tree: [
        {
          path: "src/G/Google/metadata.json",
          sha: null
        },
        {
          path: "src/G/Google/assets/logo.png",
          sha: null
        }
      ]
    });
    expect(calls.at(-1)).toMatchObject({
      method: "PATCH",
      body: {
        sha: "commit",
        force: false
      }
    });
  });

  it("does nothing when the folder is not in the repository", async () => {
    expect(await removePresenceFolder(client, "unknown")).toBe("missing");
    expect(calls.some((call) => call.method === "PATCH")).toBe(false);
  });
});