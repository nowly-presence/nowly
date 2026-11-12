export type PageAddressInput = {
  status: "plain";
  path: string;
} | {
  status: "stripped";
  path: string;
} | {
  status: "foreign";
  path: string;
};

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const WWW_PREFIX = "www.";

const hostMatchesDomain = (host: string, domain: string): boolean => {
  const bare = host.toLowerCase().startsWith(WWW_PREFIX)
    ? host.toLowerCase().slice(WWW_PREFIX.length)
    : host.toLowerCase();
  const target = domain.toLowerCase().startsWith(WWW_PREFIX)
    ? domain.toLowerCase().slice(WWW_PREFIX.length)
    : domain.toLowerCase();
  return bare === target || bare.endsWith(`.${target}`);
};

export const readPageAddress = (value: string, domain: string): PageAddressInput => {
  const trimmed = value.trim();
  const withScheme = SCHEME_PATTERN.test(trimmed) ? trimmed : null;
  const startsWithDomain = !withScheme && hostMatchesDomain(trimmed.split("/")[0] ?? "", domain) && trimmed.includes(".");
  const candidate = withScheme ?? (startsWithDomain ? `https://${trimmed}` : null);

  if (!candidate || !URL.canParse(candidate)) return {
    status: "plain",
    path: value
  };

  const url = new URL(candidate);
  const path = url.pathname || "/";

  return hostMatchesDomain(url.hostname, domain) ? { status: "stripped", path } : { status: "foreign", path: value };
};

export const isSiteTab = (tabUrl: string, domain: string): boolean => URL.canParse(tabUrl) && hostMatchesDomain(new URL(tabUrl).hostname, domain);