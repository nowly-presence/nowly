import { LegalHtml } from "@/components/legal/legal-html";
import { LEGAL_DATA_REGION } from "@/lib/constants";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import Link from "next/link";

export const LEGAL_PAGE_KEYS = ["privacy", "tos", "cookies", "legal-notice"] as const;

export type LegalPageKey = (typeof LEGAL_PAGE_KEYS)[number];

const MESSAGE_NS: Record<LegalPageKey, string> = {
  privacy: "privacy-page",
  tos: "tos-page",
  cookies: "cookies-page",
  "legal-notice": "legal-notice-page",
};

const PATHS: Record<LegalPageKey, string> = {
  privacy: "/privacy",
  tos: "/tos",
  cookies: "/cookies",
  "legal-notice": "/legal-notice",
};

const proseClassName =
  "legal-prose text-[0.98rem] leading-relaxed text-foreground/78 [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/20 [&_a]:underline-offset-4 [&_a]:transition-colors [&_a:hover]:decoration-foreground/50 [&_code]:rounded-md [&_code]:bg-code-surface [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.86em] [&_li]:mt-1.5 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5";

export const LegalView = async ({ page }: { page: LegalPageKey }) => {
  const [footer, locale, messages] = await Promise.all([
    getTranslations("footer"),
    getLocale(),
    getMessages(),
  ]);
  const copy = messages[MESSAGE_NS[page]] as {
    badge: string
    title: string
    description: string
    "last-updated": string
    intro?: string
    sections: Array<{ title: string; body: string }>
  };
  const extras = {
    dataRegion: LEGAL_DATA_REGION[locale as keyof typeof LEGAL_DATA_REGION] ?? LEGAL_DATA_REGION["en-US"],
  };
  const intro = copy.intro ?? "";
  const sections = copy.sections;

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-10">
        <header>
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{copy.badge}</p>
          <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
            {copy.title}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">{copy.description}</p>
          <p className="mt-3 text-sm text-muted-foreground">{copy["last-updated"]}</p>
        </header>

        {intro ? <LegalHtml className={`mt-10 ${proseClassName}`} extras={extras} html={intro} /> : null}

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-medium tracking-tight text-foreground">{section.title}</h2>
              <LegalHtml className={`mt-3 ${proseClassName}`} extras={extras} html={section.body} />
            </section>
          ))}
        </div>

        <nav className="mt-16 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
          {LEGAL_PAGE_KEYS.filter((key) => key !== page).map((key) => (
            <Link
              key={key}
              href={PATHS[key]}
              className="underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/50"
            >
              {footer(key)}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};
