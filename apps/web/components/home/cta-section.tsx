import { ExtensionStoreButton } from "@/components/extension-store-button";
import { docsHref } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export const CtaSection = async () => {
  const t = await getTranslations("cta");

  return (
    <section className="px-5 py-28 sm:px-10 sm:py-36">
      <div className="mx-auto max-w-[1080px] rounded-[24px] bg-foreground/[0.04] px-6 py-16 text-center shadow-[0_0_0_1px_rgba(228,242,255,0.06)] sm:px-12 sm:py-20">
        <h2 className="mx-auto max-w-[28rem] text-pretty text-[2rem] font-normal leading-[1.1] text-foreground sm:text-[2.5rem]">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-[34rem] text-base font-normal leading-relaxed text-muted-foreground sm:text-lg">
          {t("description")}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <ExtensionStoreButton variant="inverted" size="lg" />
          <a
            href={docsHref("/")}
            rel="noreferrer"
            target="_blank"
            className="text-sm text-muted-foreground underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/50"
          >
            {t("docs")}
          </a>
        </div>
      </div>
    </section>
  );
};
