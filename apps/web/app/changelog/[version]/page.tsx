import { ChangelogRelease } from "@/components/changelog/changelog-release";
import { getChangelogVersions, getDocContent, parsePublicChangelogVersion } from "@/lib/docs/content";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

type Props = {
  params: Promise<{
    version: string;
  }>;
};

export const generateStaticParams = (): Array<{ version: string }> =>
  getChangelogVersions().map((version) => ({
    version: version.parts.join("."),
  }));

const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { version } = await params;
  const parsed = parsePublicChangelogVersion(version);

  if (!parsed) {
    return { title: "Not Found", robots: { index: false, follow: false } };
  }

  const t = await getTranslations("changelog-page");

  return createMetadata({
    title: t("meta-title", { version: parsed.publicVersion }),
    description: t("description", { version: parsed.publicVersion }),
    path: `/changelog/${parsed.publicVersion}`,
    type: "article",
  });
};

const Page = async ({ params }: Props): Promise<ReactElement> => {
  const { version } = await params;
  const parsed = parsePublicChangelogVersion(version);

  if (!parsed) {
    notFound();
  }

  const locale = await getLocale();
  const doc = getDocContent(`changelog/${parsed.docSlug}`, locale);

  return <ChangelogRelease version={parsed.publicVersion} doc={doc} />;
};

export { generateMetadata };
export default Page;
