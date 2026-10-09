import { GuideCard } from "@/features/guides/components/guide-card";
import { GUIDE_CATEGORIES, getGuides } from "@/features/guides/lib/guides";
import { getLocale, getTranslations } from "next-intl/server";

export const GuidesView = async () => {
  const [t, locale] = await Promise.all([getTranslations("guidesPage"), getLocale()]);
  const guides = getGuides(locale);

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <header className="max-w-2xl">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{t("eyebrow")}</p>
          <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">{t("description")}</p>
        </header>

        <div className="mt-16 space-y-16">
          {GUIDE_CATEGORIES.map((category) => {
            const items = guides.filter((guide) => guide.category === category);
            if (items.length === 0) return null;
            return (
              <section key={category} aria-labelledby={`guides-${category}`}>
                <h2 id={`guides-${category}`} className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {t(`categories.${category}`)}
                </h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((guide) => (
                    <li key={guide.slug}>
                      <GuideCard guide={guide} minutesLabel={t("minutes", { count: guide.minutes })} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
