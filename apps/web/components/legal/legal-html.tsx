import { LEGAL_PUBLISHER } from "@/lib/constants";

const ALLOWED_HREF = /^(https?:\/\/|mailto:|\/)/i;

export const interpolateLegalHtml = (html: string, extras: Record<string, string> = {}): string => {
  const values = {
    publisherName: LEGAL_PUBLISHER.name,
    publisherSiren: LEGAL_PUBLISHER.siren,
    publisherAddress: LEGAL_PUBLISHER.address,
    publisherEmail: LEGAL_PUBLISHER.email,
    ...extras,
  };

  let out = html;
  for (const [key, value] of Object.entries(values)) {
    out = out.replaceAll(`{${key}}`, value);
  }

  return out
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/href\s*=\s*("([^"]*)"|'([^']*)')/gi, (match, _quoted, double, single) => {
      const href = double ?? single ?? "";
      return ALLOWED_HREF.test(href) ? match : "href=\"#\"";
    });
};

export const LegalHtml = ({
  html,
  extras,
  className,
}: {
  html: string
  extras?: Record<string, string>
  className?: string
}) => (
  <div
    className={className}
    dangerouslySetInnerHTML={{ __html: interpolateLegalHtml(html, extras) }}
  />
);
