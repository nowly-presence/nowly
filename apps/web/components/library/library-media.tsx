"use client";

import { PresenceTile } from "@/components/presence-tile";
import { libraryLogoUrl, libraryThumbnailUrl } from "@/lib/library-catalog";
import { cn } from "@nowly/ui";
import Image from "next/image";

import { useState } from "react";

type LibraryMediaProps = {
  slug: string
  name: string
  variant?: "card" | "hero"
};

export const LibraryMedia = ({ slug, name, variant = "card" }: LibraryMediaProps) => {
  const [bannerFailed, setBannerFailed] = useState(false);
  const isHero = variant === "hero";

  return (
    <div className={cn("relative", bannerFailed ? (isHero ? "px-6 pt-6 sm:px-8 sm:pt-8" : "px-6 pt-6") : isHero ? "mb-12 sm:mb-14" : "mb-7")}>
      {bannerFailed ? null : (
        <div className={cn("relative overflow-hidden", isHero ? "h-52 sm:h-72" : "h-36")}>
          <Image
            src={libraryThumbnailUrl(slug)}
            alt={name}
            fill
            sizes={isHero ? "(min-width: 640px) 640px, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            className="object-cover"
            onError={() => setBannerFailed(true)}
          />
        </div>
      )}
      <div
        className={cn(
          bannerFailed ? null : "absolute bottom-0 z-10 translate-y-1/2",
          bannerFailed ? null : isHero ? "left-6 sm:left-8" : "left-6",
        )}
      >
        <PresenceTile
          src={libraryLogoUrl(slug)}
          name={name}
          className={isHero ? "size-20 sm:size-24" : "size-14"}
        />
      </div>
    </div>
  );
};
