import { ProfileView } from "@/features/profile/components/profile-view";
import { getPublicProfile } from "@/features/profile/lib/public-profile";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type ProfilePageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export const generateMetadata = async ({ params }: ProfilePageProps): Promise<Metadata> => {
  const { handle } = await params;

  const [profile, locale, t] = await Promise.all([
    getPublicProfile(handle.toLowerCase()),
    getLocale(),
    getTranslations("profilePage")
  ]);

  if (!profile) return {
    robots: {
      index: false,
      follow: false
    }
  };

  return createMetadata({
    title: t("meta-title", { name: profile.name }),
    description: t("meta-description", { name: profile.name }),
    locale,
    path: `/u/${profile.handle}`
  });
};

const Page = async ({ params }: ProfilePageProps) => {
  const { handle } = await params;

  const profile = await getPublicProfile(handle.toLowerCase());

  if (!profile) notFound();

  return <ProfileView profile={profile} />;
};

export default Page;