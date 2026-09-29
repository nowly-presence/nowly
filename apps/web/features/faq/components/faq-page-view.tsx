import { JsonLd } from "@/features/seo/components/json-ld";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

type FaqItem = {
  category: string
  question: string
  answer: string
};

export const FaqPageView = async () => {
  const [t, library, desktop, support] = await Promise.all([
    getTranslations("faqPage"),
    getTranslations("pages.library"),
    getTranslations("pages.desktop"),
    getTranslations("pages.support"),
  ]);
  const items = t.raw("items") as FaqItem[];
  const categories = Object.keys(t.raw("categories") as Record<string, string>);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }}
      />

      <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
        <header className="mx-auto w-full max-w-4xl px-5 sm:px-10">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[3.5rem]">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t("description")}
          </p>
          <nav aria-label={t("eyebrow")} className="mt-8 flex flex-wrap gap-3 text-sm">
            <Link href="/library" className="underline underline-offset-4 hover:text-foreground">
              {library("title")}
            </Link>
            <Link href="/desktop" className="underline underline-offset-4 hover:text-foreground">
              {desktop("title")}
            </Link>
            <Link href="/support" className="underline underline-offset-4 hover:text-foreground">
              {support("title")}
            </Link>
          </nav>
        </header>

        <main className="mx-auto mt-16 w-full max-w-4xl space-y-14 px-5 sm:mt-24 sm:px-10">
          {categories.map((category) => {
            const categoryItems = items.filter((item) => item.category === category);
            if (categoryItems.length === 0) return null;

            return (
              <section key={category} aria-labelledby={`faq-${category}`}>
                <h2 id={`faq-${category}`} className="mb-5 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                  {t(`categories.${category}`)}
                </h2>
                <div className="divide-y divide-border rounded-2xl border border-border bg-card">
                  {categoryItems.map((item) => (
                    <details key={item.question} className="group px-5 py-5 first:rounded-t-2xl last:rounded-b-2xl sm:px-7">
                      <summary className="cursor-pointer list-none pr-8 text-lg font-medium text-foreground marker:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
                        <span className="relative after:absolute after:right-0 after:content-['+'] group-open:after:content-['−']">
                          {item.question}
                        </span>
                      </summary>
                      <p className="max-w-3xl pt-4 text-base leading-relaxed text-muted-foreground">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </>
  );
};
