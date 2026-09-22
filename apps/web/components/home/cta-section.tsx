import { ExtensionStoreButton } from "@/components/extension-store-button";
import { homeSectionAltClass } from "@/components/home/section-heading";
import { Link } from "@/i18n/navigation";
import { cn } from "@nowly/ui";

import { getTranslations } from "next-intl/server";

export const CtaSection = async () => {
  const t = await getTranslations("cta");

  return (
    <section className={cn("px-5 py-28 sm:px-10 sm:py-36", homeSectionAltClass)}>
      <div className="mx-auto max-w-[1080px] rounded-[24px] bg-cta-surface px-6 py-16 text-center text-cta-ink sm:px-12 sm:py-20">
        <h2 className="mx-auto max-w-[28rem] text-pretty text-[2rem] font-normal leading-[1.1] sm:text-[2.5rem]">
          {t("title")}
        </h2>
        <p className="mx-auto mt-2 max-w-[34rem] text-base font-normal leading-relaxed text-cta-muted sm:text-lg">
          {t("description")}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <ExtensionStoreButton variant="dark" size="lg" />
          <Link
            href="/extension"
            className="text-sm text-cta-muted underline decoration-cta-muted/40 underline-offset-4 transition-colors hover:text-cta-ink hover:decoration-cta-ink/60"
          >
            {t("other-versions")}
          </Link>
        </div>
      </div>
    </section>
  );
};
