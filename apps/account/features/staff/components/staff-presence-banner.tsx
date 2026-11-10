"use client";

import { presenceLogoUrl, presenceThumbnailUrl } from "@/lib/api-base";
import { useState } from "react";

export const StaffPresenceBanner = ({ slug }: {
  slug: string;
}) => {
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  return (
    <span className="relative block h-9 bg-foreground/8">
      {bannerFailed ? null : <img src={presenceThumbnailUrl(slug)} alt="" className="size-full object-cover" onError={() => setBannerFailed(true)} />}
      <span className="absolute bottom-0 left-3 flex size-8 translate-y-1/2 items-center justify-center overflow-hidden rounded-[8px] bg-background ring-2 ring-background">
        {logoFailed ? null : <img src={presenceLogoUrl(slug)} alt="" className="size-full object-cover" onError={() => setLogoFailed(true)} />}
      </span>
    </span>
  );
};