import { GitHubIcon } from "@/components/icons";
import { buttonVariants } from "@nowly/ui";

import { PROJECT_REPOSITORY_URL } from "@/lib/constants";
import Link from "next/link";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";

type EditOnGitHubProps = {
  slug: string;
  locale: string;
};

export const EditOnGitHub: FC<EditOnGitHubProps> = async ({ slug, locale }) => {
  // Per-version changelog content lives in the @nowly/changelog package, not in this app.
  const contentPath = slug.startsWith("changelog/")
    ? `packages/changelog/content/${slug.replace(/^changelog\//, "")}`
    : `apps/docs/content/docs/${slug}`;
  const href = `${PROJECT_REPOSITORY_URL}/blob/stable/${contentPath}/${locale}.mdx`;
  const t = await getTranslations("docsUi");

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ size: "sm" })}
    >
      <GitHubIcon className="size-4" />
      {t("edit-on-github")}
    </Link>
  );
};
