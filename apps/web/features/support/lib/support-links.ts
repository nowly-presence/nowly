import { GITHUB_SPONSORS_URL, KOFI_URL, PRESENCES_REPOSITORY_URL, PROJECT_REPOSITORY_URL } from "@/lib/constants";

export const githubIssueUrl = (repo: string, template?: string): string => {
  const base = `${repo.replace(/\/$/, "")}/issues/new`;
  return template ? `${base}?template=${template}` : base;
};

export const SUPPORT_LINKS = {
  brokenPresence: githubIssueUrl(PRESENCES_REPOSITORY_URL, "broken_presence.yml"),
  newPresence: githubIssueUrl(PRESENCES_REPOSITORY_URL, "new_presence.yml"),
  bugReport: githubIssueUrl(PROJECT_REPOSITORY_URL, "bug_report.yml"),
  featureRequest: githubIssueUrl(PROJECT_REPOSITORY_URL, "feature_request.yml"),
  blankIssue: githubIssueUrl(PROJECT_REPOSITORY_URL),
  kofi: KOFI_URL,
  sponsors: GITHUB_SPONSORS_URL,
} as const;
