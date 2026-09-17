import { assetUrl } from "@/shared/api";
import type { FC, ReactElement, ReactNode } from "react";
import { useState } from "react";

type Props = {
  children: ReactNode;
  color: string;
  footer?: ReactNode;
  slug: string;
};

export const PresenceHeroCard: FC<Props> = ({ children, footer, slug }): ReactElement => {
  const [banner, setBanner] = useState(true);

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-card">
      {banner ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden">
          <img
            src={assetUrl(slug, "thumbnail")}
            alt=""
            aria-hidden="true"
            className="size-full object-cover opacity-45"
            onError={() => setBanner(false)}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-card/75 to-card" />
        </div>
      ) : null}
      <div className={`relative z-10 p-4 ${banner ? "pt-16" : ""}`}>{children}</div>
      {footer}
    </section>
  );
};
