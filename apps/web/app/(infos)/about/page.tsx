import { createMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { IconCode, IconHeartHandshake, IconLock, IconSparkles } from "@tabler/icons-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { FC, ReactElement } from "react";

const generateMetadata = (): Metadata => {
  return createMetadata({
    title: "About Nowly",
    description: "Learn more about Nowly, the open-source Discord Rich Presence extension for streaming platforms.",
    path: "/about",
  });
};

const Page: FC = async (): Promise<ReactElement> => {
  const t = await getTranslations("about-page");

  const sections = t.raw("sections") as Array<{
    title: string
    body: string
  }>;

  const cards = [
    { ...sections[0], icon: IconSparkles, className: "md:col-span-7", highlight: true },
    { ...sections[1], icon: IconLock, className: "md:col-span-5", highlight: false },
    { ...sections[2], icon: IconHeartHandshake, className: "md:col-span-5", highlight: false },
    { ...sections[3], icon: IconCode, className: "md:col-span-7", highlight: true }
  ];

  return (
    <main className="mx-auto w-full max-w-5xl min-w-0 px-6 py-24">
      <div className="mb-12 min-w-0 py-12 text-center">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent/10 text-accent border border-accent/20 text-[11px] font-bold uppercase tracking-wider mb-4">
          {t("badge")}
        </div>

        <h1 className="mx-auto mb-4 max-w-3xl text-balance text-[2rem] font-extrabold tracking-tight md:text-[2.25rem]">
          {t("title")}
        </h1>

        <p className="mx-auto max-w-xl text-balance text-muted-foreground">
          {t("intro")}
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-12">
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
            <section
              key={card.title}
              className={cn(
                "group relative min-w-0 overflow-hidden rounded-lg border border-border bg-card p-6 md:min-h-44",
                card.highlight && "border-accent/10 bg-linear-to-br from-accent/10 via-card to-card",
                card.className
              )}
            >
              {card.highlight ? (
                <>
                  <div className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-accent opacity-10 blur-3xl transition-opacity" />
                  <div className="pointer-events-none absolute -right-8 -top-8 size-12 rounded-full bg-accent opacity-15 blur-xl transition-opacity" />
                </>
              ) : null}

              <div className="relative mb-6 flex items-center justify-between gap-4">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="size-5" />
                </span>
                <span className="font-mono text-sm font-bold text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <h2 className="relative mb-3 wrap-break-word text-xl font-semibold text-foreground">
                {card.title}
              </h2>
              <p className="relative text-sm leading-relaxed text-muted-foreground">
                {card.body}
              </p>
            </section>
          );
        })}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-dim-foreground">
        {t("analytics-note")}
      </p>
    </main>
  );
};

export { generateMetadata };
export default Page;
