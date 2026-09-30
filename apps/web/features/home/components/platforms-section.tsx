import { Suspense } from "react";

import { homeSectionAltClass, SectionHeading } from "@/features/home/components/section-heading";
import { PresenceTile } from "@/components/presence-tile";
import { Link } from "@/i18n/navigation";
import { getPresencePlatforms, type PresencePlatform } from "@/lib/presence-api";
import { cn } from "@nowly/ui/utils";

import { getTranslations } from "next-intl/server";

const LogoTrack = ({
  platforms,
  inert,
}: {
  platforms: PresencePlatform[]
  inert?: boolean
}) => (
  <div
    className="flex shrink-0 gap-3.5 pr-3.5"
    aria-hidden={inert ? true : undefined}
  >
    {platforms.map((platform) => (
      <Link
        key={`${inert ? "clone" : "main"}-${platform.slug}`}
        href={`/library/${platform.slug}`}
        prefetch={false}
        tabIndex={inert ? -1 : undefined}
        aria-label={inert ? undefined : platform.name}
        className="relative z-0 size-[80px] shrink-0 transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.125] sm:size-[96px] sm:hover:scale-[1.104]"
      >
        <PresenceTile
          src={platform.logoUrl}
          name=""
          className="size-full"
        />
      </Link>
    ))}
  </div>
);

const PlatformMarquee = async ({ platforms }: { platforms: Promise<PresencePlatform[]> }) => {
  const resolvedPlatforms = await platforms;

  if (resolvedPlatforms.length === 0) return null;

  return (
    <div
      className="marquee-hover relative mt-12 overflow-hidden py-3"
      style={{
        maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div className="animate-marquee flex w-max">
        <LogoTrack platforms={resolvedPlatforms} />
        <LogoTrack platforms={resolvedPlatforms} inert />
      </div>
    </div>
  );
};


export const PlatformsSection = async () => {
  const t = await getTranslations("platforms");
  const platforms = getPresencePlatforms();

  return (
    <section className={cn("overflow-x-clip px-5 py-28 sm:px-10 sm:py-36", homeSectionAltClass)}>
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <Suspense fallback={<div className="mt-12 h-[112px] sm:h-[128px]" aria-hidden />}>
        <PlatformMarquee platforms={platforms} />
      </Suspense>
    </section>
  );
};
