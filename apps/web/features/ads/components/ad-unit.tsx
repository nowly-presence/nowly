"use client";

import Script from "next/script";
import { useEffect } from "react";

type AdsByGoogleWindow = Window & { adsbygoogle?: Array<Record<string, never>> };

export const AdUnit = ({ client, slot, label }: { client: string; slot: string; label: string }) => {
  useEffect(() => {
    try {
      const target = window as AdsByGoogleWindow;
      target.adsbygoogle = target.adsbygoogle ?? [];
      target.adsbygoogle.push({});
    } catch {
      /* blocked by an extension or not loaded yet: the slot just stays empty */
    }
  }, []);

  return (
    <>
      <Script
        id="adsbygoogle"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
      <p className="mb-2 text-center text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <ins
        className="adsbygoogle block min-h-25"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </>
  );
};
