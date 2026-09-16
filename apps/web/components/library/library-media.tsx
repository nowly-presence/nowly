"use client";

import { PresenceTile } from "@/components/presence-tile";
import { libraryLogoUrl, libraryThumbnailUrl } from "@/lib/library-catalog";
import { cn } from "@/lib/utils";
import { useState } from "react";

type LibraryMediaProps = {
  slug: string
  name: string
};

export const LibraryMedia = ({ slug, name }: LibraryMediaProps) => {
  const [bannerFailed, setBannerFailed] = useState(false);

  return (
    <div className={cn("relative", bannerFailed ? "px-6 pt-6" : "mb-7")}>
      {bannerFailed ? null : (
        <div className="h-36 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={libraryThumbnailUrl(slug)}
            alt=""
            className="size-full object-cover"
            onError={() => setBannerFailed(true)}
          />
        </div>
      )}
      <div
        className={cn(
          bannerFailed ? null : "absolute bottom-0 left-6 z-10 translate-y-1/2",
        )}
      >
        <PresenceTile
          src={libraryLogoUrl(slug)}
          name={name}
          className="size-14"
        />
      </div>
    </div>
  );
};
