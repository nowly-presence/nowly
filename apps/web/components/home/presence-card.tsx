"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import type { PresenceCardConfig } from "@/components/home/hero-presence-cards";

type PresenceCardProps = {
  config: PresenceCardConfig
};

// All offsets below are expressed as cqw (percent of the card's own width),
// derived from the 646x221 Figma source so the layout scales losslessly at
// any rendered size while keeping the ratio between width- and height-axis
// values correct (the card's aspect ratio is locked via `aspect-[646/221]`).
const qw = (px: number): string => `${(px / 646) * 100}cqw`;

const ELAPSED_ICON = "/media/hero/cards/figma-timer-icon.svg";
const ELAPSED_COLOR = "#61bf67";

export const PresenceCard = ({ config }: PresenceCardProps) => {
  const t = useTranslations(`hero.cards.${config.messageKey}`);
  const { timestamp } = config;
  const buttonTop = timestamp.kind === "none" && !config.hasSubtitle ? 116 : 151;

  return (
    <div className="relative aspect-[646/221] w-full select-none [container-type:inline-size]">
      <div
        className="absolute inset-0 overflow-hidden bg-[#050505] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
        style={{ borderRadius: qw(17) }}
      >
        <p
          className="absolute whitespace-nowrap font-medium text-[#e4f2ff]"
          style={{ left: qw(17), top: qw(20), fontSize: qw(16) }}
        >
          {t("app-label")}
        </p>

        <div
          className="absolute overflow-hidden"
          style={{ left: qw(17), top: qw(53), width: qw(150), height: qw(150), borderRadius: qw(11) }}
        >
          <Image
            src={config.largeImage}
            alt={t("title")}
            fill
            sizes="150px"
            className={config.largeContain ? "object-contain p-[8%]" : "object-cover"}
          />
        </div>

        {config.smallImage ? (
          <div
            className="absolute overflow-hidden rounded-full bg-[#050505] shadow-[0_0_0_3px_#050505]"
            style={{ left: qw(132), top: qw(168), width: qw(41), height: qw(41) }}
          >
            <Image src={config.smallImage} alt="" fill sizes="41px" className="object-contain" />
          </div>
        ) : null}

        <div className="absolute" style={{ left: qw(193), top: qw(62), right: qw(37) }}>
          <p className="truncate font-medium text-[#e4f2ff]" style={{ fontSize: qw(16) }}>
            {t("title")}
          </p>
          {config.hasSubtitle ? (
            <p className="mt-[0.4em] truncate font-black text-[#e4f2ff]" style={{ fontSize: qw(16) }}>
              {t("subtitle")}
            </p>
          ) : null}
        </div>

        {timestamp.kind === "progress" ? (
          <div
            className="absolute flex items-center"
            style={{ left: qw(193), top: qw(116), right: qw(37), height: qw(22) }}
          >
            <span className="whitespace-nowrap font-medium text-[#e4f2ff]" style={{ fontSize: qw(16) }}>
              {t("elapsed")}
            </span>
            <div className="mx-[0.8cqw] h-[0.6cqw] flex-1 overflow-hidden rounded-full bg-[#212121]">
              <div className="h-full rounded-full bg-[#e4f2ff]" style={{ width: `${timestamp.progress}%` }} />
            </div>
            <span className="whitespace-nowrap font-medium text-[#e4f2ff]" style={{ fontSize: qw(16) }}>
              {t("duration")}
            </span>
          </div>
        ) : null}

        {timestamp.kind === "elapsed" ? (
          <div className="absolute flex items-center gap-[0.6cqw]" style={{ left: qw(193), top: qw(116), height: qw(22) }}>
            <div className="relative shrink-0" style={{ width: qw(18), height: qw(13) }}>
              <Image src={timestamp.icon ?? ELAPSED_ICON} alt="" fill sizes="18px" />
            </div>
            <span
              className="whitespace-nowrap font-medium"
              style={{ fontSize: qw(16), color: timestamp.color ?? ELAPSED_COLOR }}
            >
              {t("timer")}
            </span>
          </div>
        ) : null}

        {config.hasButton ? (
          config.buttonHref ? (
            <a
              href={config.buttonHref}
              rel="noreferrer"
              target="_blank"
              className="absolute flex items-center justify-center bg-[#212121] transition-colors hover:bg-[#2c2c2c]"
              style={{ left: qw(193), top: qw(buttonTop), right: qw(37), height: qw(43), borderRadius: qw(10) }}
            >
              <span className="whitespace-nowrap font-medium text-[#fdfdfd]" style={{ fontSize: qw(17) }}>
                {t("cta")}
              </span>
            </a>
          ) : (
            <div
              className="absolute flex items-center justify-center bg-[#212121]"
              style={{ left: qw(193), top: qw(buttonTop), right: qw(37), height: qw(43), borderRadius: qw(10) }}
            >
              <span className="whitespace-nowrap font-medium text-[#fdfdfd]" style={{ fontSize: qw(17) }}>
                {t("cta")}
              </span>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};
