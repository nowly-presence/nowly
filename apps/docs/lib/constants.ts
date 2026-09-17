export const MARKETING_ORIGIN = "https://nowly.me";
export const DOCS_ORIGIN = "https://docs.nowly.me";

export const SITE_URL = MARKETING_ORIGIN;
export const DOCS_URL = DOCS_ORIGIN;
export const PROJECT_REPOSITORY_URL = "https://github.com/nowly-presence/nowly";
export const DISCORD_INVITE_URL = "https://discord.gg/MnZap7czgB";

const hostnameOf = (value: string): string => {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
};

const deployDocsHost = hostnameOf(
  (process.env.NEXT_PUBLIC_DOCS_BASE_URL ?? DOCS_ORIGIN).replace(/\/$/, ""),
);

export const isSeoPreview =
  deployDocsHost !== "" && deployDocsHost !== "docs.nowly.me";
