import { GitHubIcon } from "@/components/icons";
import { buttonVariants } from "@nowly/ui";

import { PROJECT_REPOSITORY_URL } from "@/lib/constants";
import Link from "next/link";
import type { FC } from "react";

type EditOnGitHubProps = {
  slug: string;
  locale: string;
};

export const EditOnGitHub: FC<EditOnGitHubProps> = ({ slug, locale }) => {
  const href = `${PROJECT_REPOSITORY_URL}/blob/stable/apps/docs/content/docs/${slug}/${locale}.mdx`;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ size: "sm" })}
    >
      <GitHubIcon className="size-4" />
      Edit on GitHub
    </Link>
  );
};