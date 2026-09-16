import { ExtensionStoreButton } from "@/components/extension-store-button";
import { homeSectionAltClass, SectionHeading } from "@/components/home/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { RiAddLine, RiBookShelfFill, RiWindow2Fill, RiWindowLine } from "@remixicon/react";
import { getTranslations } from "next-intl/server";

type StepItem = {
  title: string
  text: string
  action: string
};

const actions = [
  {
    render: (label: string) => (
      <ExtensionStoreButton variant="dark" size="sm">
        {label}
      </ExtensionStoreButton>
    ),
  },
  {
    render: (label: string) => (
      <ButtonLink href="/host" variant="dark" size="sm">
        <RiWindow2Fill data-icon="inline-start" />
        {label}
      </ButtonLink>
    ),
  },
  {
    render: (label: string) => (
      <ButtonLink href="/library" variant="dark" size="sm">
        <RiBookShelfFill data-icon="inline-start" />
        {label}
      </ButtonLink>
    ),
  },
] as const;

export const StepsSection = async () => {
  const t = await getTranslations("steps");
  const items = t.raw("items") as StepItem[];

  return (
    <section className={`px-5 py-28 sm:px-6 sm:py-36 ${homeSectionAltClass}`}>
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <div className="mx-auto mt-12 grid max-w-[1200px] gap-5 md:grid-cols-3">
        {items.map((item, index) => {
          const action = actions[index];
          return (
            <article
              key={item.title}
              className="relative min-h-[190px] overflow-hidden rounded-[14px] bg-cta-surface p-5 text-cta-ink"
            >
              <span className="pointer-events-none absolute bottom-0 left-0 origin-bottom-left translate-x-[-38px] translate-y-[42px] select-none text-[260px] font-black leading-none lining-nums text-[rgba(7,8,12,0.1)]">
                {index + 1}
              </span>

              <div className="relative z-10 flex h-full min-h-[150px] flex-col pl-[84px]">
                <h3 className="text-[1.05rem] font-semibold leading-tight">{item.title}</h3>
                <p className="mt-2 max-w-[36ch] flex-1 text-sm leading-snug text-cta-muted">{item.text}</p>
                <div className="mt-5">{action?.render(item.action)}</div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
