import { cn } from "@/lib/cn";
import { assetUrl } from "@/shared/api";
import type { FC } from "react";
import { useEffect, useState } from "react";

type Props = {
  slug: string;
  name: string;
  className?: string;
  dimmed?: boolean;
};

/**
 * Presence artwork tile matching the nowly.me library cards: a fixed near-black
 * base with the logo blurred behind and sharp on top. This keeps light or dark
 * logos readable in both the light and dark appearance, unlike a themed tint.
 */
export const PresenceTile: FC<Props> = ({ slug, name, className, dimmed = false }) => {
  const [src, setSrc] = useState(() => assetUrl(slug, "logo"));

  useEffect(() => {
    setSrc(assetUrl(slug, "logo"));
  }, [slug]);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[22%] bg-[#03080c] transition-all duration-300",
        dimmed ? "opacity-60 saturate-0" : "",
        className,
      )}
    >
      <img
        src={src}
        alt={name}
        className="size-full object-cover"
        onError={() => {
          const icon = assetUrl(slug, "icon");
          if (src !== icon) setSrc(icon);
        }}
      />
    </div>
  );
};
