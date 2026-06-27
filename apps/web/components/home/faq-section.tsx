import { DiscordIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { IconArrowRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";

export const FaqSection: FC = (): ReactElement => {
  const t = useTranslations("home-faq-section");
  const items = t.raw("items") as Array<{
    question: string
    answer: string
  }>;

  return (
    <section className="py-24 border-b border-border">
      <div className="mx-auto w-full max-w-300 min-w-0 px-6">
        <div className="grid min-w-0 grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <div className="min-w-0">
            <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">
              {t("section-label")}
            </span>

            <h2 className="mb-4 text-balance text-[2.5rem]">
              {t("title")}
            </h2>

            <p className="text-balance leading-relaxed text-muted-foreground">
              {t("description")}
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/faq" className={buttonVariants({ variant: "primary", size: "md" })}>
                {t("faq-cta")}
                <IconArrowRight className="h-4 w-4" />
              </Link>

              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "secondary", size: "md" }))}
              >
                <DiscordIcon />
                {t("discord-cta")}
              </a>
            </div>
          </div>

          <div className="grid min-w-0 gap-4">
            {items.map((item, index) => (
              <article
                key={item.question}
                className="min-w-0 rounded-lg border border-border bg-card p-6"
              >
                <span className="text-accent font-mono text-sm font-bold mb-3 block">
                  0{index + 1}
                </span>
                <h3 className="mb-2 wrap-break-word text-lg font-semibold">
                  {item.question}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
