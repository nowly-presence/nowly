import { GitHubIcon } from "@/components/icons";
import { buttonVariants } from "@nowly/ui";
import { docSourceUrl } from "@/features/docs-content/lib/href";
import Link from "next/link";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";

type EditOnGitHubProps = {
  slug: string;
  locale: string;
};

export const EditOnGitHub: FC<EditOnGitHubProps> = async ({ slug, locale }) => {
  const href = docSourceUrl(slug, locale);
  const t = await getTranslations("docsUi");

  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "sm" })}>
      <GitHubIcon className="size-4" />
      {t("edit-on-github")}
    </Link>
  );
};