import { ButtonLink } from "@nowly/ui";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NotFoundPage = async () => {
  const t = await getTranslations("not-found");

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-5 py-20 text-center">
      <h1 className="text-3xl font-medium">{t("title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("description")}</p>
      <ButtonLink href="/" className="mt-8">
        {t("home")}
      </ButtonLink>
    </section>
  );
};

export default NotFoundPage;
