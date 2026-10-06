
const ALLOWED_HREF = /^(https?:\/\/|mailto:|\/)/i;

export const interpolateLegalHtml = (html: string, extras: Record<string, string> = {}): string => {
  let out = html;
  for (const [key, value] of Object.entries(extras)) {
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
