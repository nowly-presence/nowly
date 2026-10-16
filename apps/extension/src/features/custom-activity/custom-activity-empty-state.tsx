import { useEffect, useState } from "react";
import { RiAddLine, RiLayoutGridLine } from "@remixicon/react";
import { CustomActivityArtwork } from "@/components/shared/custom-activity-artwork";
import { LiveCard } from "@/components/shared/live-activity-card";
import { useI18n } from "@/hooks/i18n-provider";
import { buildCustomPresence, customActivitySlug, emptyCustomActivityDraft } from "@/shared/custom-activity";
import type { CustomActivityDraft, CustomActivityType, CustomImage } from "@/shared/types";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { cn } from "@/ui/cn";

type Sample = {
  id: string;
  type: CustomActivityType;
  name: string;
  details: string;
  state: string;
  largeImage: CustomImage;
  minutes: number;
  startedAgoMs: number;
};

const MINUTE_MS = 60_000;
const ROTATE_MS = 4500;
const LAYER_OFFSET_PX = 10;
const LAYER_SCALE_STEP = 0.05;
const LAYER_OPACITY = [1, 0.55, 0.28] as const;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const toDraft = (sample: Sample): CustomActivityDraft => ({
  ...emptyCustomActivityDraft(),
  type: sample.type,
  name: sample.name,
  details: sample.details,
  state: sample.state,
  largeImage: sample.largeImage,
  timestamp: {
    mode: "countdown",
    minutes: sample.minutes
  }
});

const useRotation = (count: number): number => {
  const [front, setFront] = useState(0);
  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION).matches) return;

    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setFront((value) => (value + 1) % count);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [count]);
  return front;
};

export const CustomActivityEmptyState = ({ onCreate, onTemplates }: {
  onCreate: () => void;
  onTemplates: () => void;
}) => {
  const { t } = useI18n();
  const [now] = useState(() => Date.now());
  const samples: Sample[] = [
    {
      id: "study",
      type: 0,
      name: t("custom.empty.studyName"),
      details: t("custom.empty.studyDetails"),
      state: t("custom.empty.studyState"),
      largeImage: {
        kind: "icon",
        icon: "graduation",
        color: "#5a6bb0"
      },
      minutes: 25,
      startedAgoMs: 9 * MINUTE_MS
    },
    {
      id: "code",
      type: 0,
      name: t("custom.empty.codeName"),
      details: t("custom.empty.codeDetails"),
      state: t("custom.empty.codeState"),
      largeImage: {
        kind: "icon",
        icon: "code",
        color: "#3f7d6b"
      },
      minutes: 90,
      startedAgoMs: 52 * MINUTE_MS
    },
    {
      id: "game",
      type: 0,
      name: t("custom.empty.gameName"),
      details: t("custom.empty.gameDetails"),
      state: t("custom.empty.gameState"),
      largeImage: {
        kind: "icon",
        icon: "trophy",
        color: "#8a7a3c"
      },
      minutes: 120,
      startedAgoMs: 34 * MINUTE_MS
    }
  ];
  const front = useRotation(samples.length);

  return (
    <Card className="flex flex-col items-center gap-6 px-5 pt-6 pb-6">
      <div aria-hidden className="pointer-events-none grid w-full max-w-[320px] select-none" style={{ paddingBottom: (samples.length - 1) * LAYER_OFFSET_PX }}>
        {samples.map((sample, index) => {
          const depth = (index - front + samples.length) % samples.length;
          const draft = toDraft(sample);
          return (
            <div
              key={sample.id}
              className={cn(
                "col-start-1 row-start-1 rounded-lg bg-surface transition-[transform,opacity] duration-500 ease-out-soft [&_article>*]:transition-opacity [&_article>*]:duration-500",
                depth > 0 && "[&_article>*]:opacity-0"
              )}
              style={{
                zIndex: samples.length - depth,
                opacity: LAYER_OPACITY[depth] ?? 0,
                transform: `translateY(${depth * LAYER_OFFSET_PX}px) scale(${1 - depth * LAYER_SCALE_STEP})`,
                transformOrigin: "bottom center"
              }}
            >
              <LiveCard
                slug={customActivitySlug(`sample-${sample.id}`)}
                presence={buildCustomPresence(draft, now - sample.startedAgoMs)}
                presenceName={sample.name}
                t={t}
                compact
                artwork={<CustomActivityArtwork source={draft} size={40} rounded="rounded-md" />}
              />
            </div>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex flex-col gap-1.5">
          <p className="text-body-lg font-medium tracking-[-0.2px] text-ink">{t("custom.empty.title")}</p>
          <p className="mx-auto max-w-72 text-body-sm text-balance text-muted">{t("custom.empty.description")}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button icon={<RiAddLine className="size-4" />} onClick={onCreate}>
            {t("custom.empty.action")}
          </Button>
          <Button variant="secondary" icon={<RiLayoutGridLine className="size-4" />} onClick={onTemplates}>
            {t("custom.empty.templates")}
          </Button>
        </div>
      </div>
    </Card>
  );
};