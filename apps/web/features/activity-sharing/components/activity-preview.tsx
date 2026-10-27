"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { PortableActivity } from "@nowly/shared";
import { previewClock, previewHeader, previewImage, previewLines } from "@/features/activity-sharing/lib/activity-preview";

const PreviewButton = ({ button }: { button: PortableActivity["buttons"][number] }) => (
  <a
    href={button.url}
    rel="noopener noreferrer"
    target="_blank"
    className="flex min-h-10 items-center justify-center rounded-[10px] bg-[#212121] px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[#2c2c2c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
  >
    {button.label}
  </a>
);

const PreviewText = ({ activity }: { activity: PortableActivity }) => (
  <div className="min-w-0 space-y-1">
    {previewLines(activity).map((line, index) => (
      <p key={index} className={index === 0 ? "break-words text-sm font-medium sm:text-base" : "break-words text-sm font-bold sm:text-base"}>
        {line}
      </p>
    ))}
  </div>
);

export const ActivityPreview = ({ activity }: {
  activity: PortableActivity;
}) => {
  const t = useTranslations("activitySharing");
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const countdown = activity.timestamp.mode === "countdown" ? activity.timestamp.minutes * 60 : null;
  const large = previewImage(activity.largeImage) ?? "https://cdn.nowly.me/brand/icons/blue/512.png";
  const small = previewImage(activity.smallImage);
  const header = previewHeader(activity);
  return (
    <article className="rounded-2xl border border-transparent bg-[#050505] p-4 text-[#e4f2ff] dark:border-white/10 sm:p-5" aria-label={t("preview")}>
      <p className="mb-4 text-sm font-medium sm:text-base">{t(header, { name: activity.name })}</p>
      <div className="flex items-start gap-4 sm:gap-6">
        <div className="relative size-20 shrink-0 sm:size-36">
          <img src={large} alt="" title={activity.largeText} referrerPolicy="no-referrer" className="size-full rounded-xl object-cover" />
          {small && (
            <img
              src={small}
              alt=""
              title={activity.smallText}
              referrerPolicy="no-referrer"
              className="absolute -bottom-1 -right-1 size-7 rounded-full border-[3px] border-[#050505] object-cover sm:size-10"
            />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <PreviewText activity={activity} />
          {countdown !== null && (
            <progress
              aria-label={t("timer")}
              className="h-1 w-full overflow-hidden rounded-full accent-white"
              max={countdown}
              value={Math.max(0, countdown - seconds)}
            />
          )}
          <p className="flex items-center gap-2 text-sm font-medium tabular-nums text-[#61bf67]">
            <img src="/media/hero/cards/figma-timer-icon.svg" alt="" className="h-3.5 w-[18px]" />
            {countdown !== null ? `-${previewClock(countdown - seconds)}` : previewClock(seconds)}
          </p>
        </div>
      </div>
      {activity.buttons.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {activity.buttons.map((button, index) => (
            <PreviewButton key={index} button={button} />
          ))}
        </div>
      )}
    </article>
  );
};