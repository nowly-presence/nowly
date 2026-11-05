import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { publicationIdSchema } from "@nowly/shared/activity-publication";
import { ActivitySharingView } from "@/features/activity-sharing/components/activity-sharing-view";
import { fetchActivityPublication } from "@/features/activity-sharing/lib/activity-publication";
import { createMetadata } from "@/features/seo/lib/seo";

type ActivityPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const NOT_SHARED_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export const generateMetadata = async ({ params }: ActivityPageProps): Promise<Metadata> => {
  const { id } = await params;

  if (!publicationIdSchema.safeParse(id).success) return NOT_SHARED_METADATA;

  try {
    const [{ publication }, locale, t] = await Promise.all([
      fetchActivityPublication(id),
      getLocale(),
      getTranslations("activitySharing")
    ]);

    const { activity, author } = publication;

    return createMetadata({
      title: activity.name,
      description: t("meta-description", { name: author.name }),
      locale,
      path: `/activities/${id}`,
      badge: t("title"),
      logo: activity.largeImage.kind === "url" ? activity.largeImage.url : undefined,
      noIndex: true
    });
  } catch {
    return NOT_SHARED_METADATA;
  }
};

const Page = async ({ params }: ActivityPageProps) => {
  const { id } = await params;
  return <ActivitySharingView id={id} />;
};

export default Page;