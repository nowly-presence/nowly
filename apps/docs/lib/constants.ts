export const MARKETING_ORIGIN = "https://nowly.me";

export const DOCS_BASE_PATH = (process.env.NEXT_PUBLIC_DOCS_BASE_PATH ?? "").replace(/\/$/, "");
export const DOCS_URL = DOCS_BASE_PATH ? `${MARKETING_ORIGIN}${DOCS_BASE_PATH}` : "https://docs.nowly.me";

export const PROJECT_REPOSITORY_URL = "https://github.com/nowly-presence/nowly";

export const DISCORD_SITE_URL = "https://discord.com";

const hostnameOf = (value: string): string => {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
};

const deployDocsHost = hostnameOf((process.env.NEXT_PUBLIC_DOCS_BASE_URL ?? DOCS_URL).replace(/\/$/, ""));

export const isSeoPreview = deployDocsHost !== "" && deployDocsHost !== "docs.nowly.me" && deployDocsHost !== "nowly.me";