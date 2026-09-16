import { homeSectionAltClass } from "@/components/home/section-heading";
import { ButtonAnchor } from "@/components/ui/button-link";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import { docsHref } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { RiArrowRightLine, RiDiscordFill } from "@remixicon/react";
import { getTranslations } from "next-intl/server";

export const FaqSection = async () => {
  const t = await getTranslations("faq");
  const items = t.raw("items") as Array<{ question: string; answer: string }>;

  return (
    <section className={cn("px-5 py-28 sm:px-10 sm:py-36", homeSectionAltClass)}>
      <div className="mx-auto grid w-full max-w-[1200px] items-start gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
        <div>
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{t("eyebrow")}</p>
          <h2 className="text-pretty text-[26px] font-normal leading-tight text-foreground sm:text-[2.15rem]">
            {t("title")}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground sm:text-lg">{t("description")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonAnchor href={docsHref("/")} rel="noreferrer" target="_blank" variant="inverted">
              {t("docs")}
              <RiArrowRightLine data-icon="inline-end" />
            </ButtonAnchor>
            <ButtonAnchor href={DISCORD_INVITE_URL} rel="noreferrer" target="_blank" variant="ghost">
              <RiDiscordFill data-icon="inline-start" />
              {t("discord")}
            </ButtonAnchor>
          </div>
        </div>

        <div className="grid gap-4">
          {items.map((item, index) => (
            <Card key={item.question}>
              <CardContent>
                <span className="mb-3 block font-mono text-sm font-bold text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <CardTitle className="text-lg">{item.question}</CardTitle>
                <CardDescription className="mt-2">{item.answer}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
