import { RiLockLine, RiPuzzleLine, RiBarChartLine } from "@remixicon/react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

const icons = [RiLockLine, RiBarChartLine, RiPuzzleLine];

export const PrivacySection = async () => {
  const t = await getTranslations("privacy-section");
  const items = t.raw("items") as Array<{ title: string; description: string }>;

  return (
    <section className="px-5 py-28 sm:px-10 sm:py-36">
      <div className="mx-auto grid w-full max-w-300 items-start gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-20">
        <div>
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{t("eyebrow")}</p>
          <h2 className="text-pretty text-[26px] font-normal leading-tight text-foreground sm:text-[2.15rem]">
            {t("title")}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground sm:text-lg">{t("description")}</p>
          <p className="mt-8">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/50"
            >
              {t("cta")}
            </Link>
          </p>
        </div>

        <ul className="divide-y divide-foreground/8 rounded-[16px] bg-foreground/4 shadow-[0_0_0_1px_rgba(228,242,255,0.06)]">
          {items.map((item, index) => {
            const Icon = icons[index] ?? RiLockLine;
            return (
              <li key={item.title} className="flex gap-4 px-6 py-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/12 text-accent">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-medium leading-snug text-foreground">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
