import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, domAnimation, LazyMotion, m, useReducedMotion } from "motion/react"
import { CostumedNolo } from "@/components/shared/nolo-costumed"
import { SEASON_SHAPES } from "@/components/shared/season-shapes"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useFeatureReveals } from "@/hooks/feature-reveal-provider"
import { useI18n, type MessageKey } from "@/hooks/i18n-provider"
import { useSeason } from "@/hooks/season-provider"
import { Button } from "@/ui/button"
import { StreamingText } from "@/ui/streaming-text"
import { NewYearCountdown, NewYearFireworks } from "@/features/seasonal/new-year-countdown"
import { useSeasonMoment } from "@/features/seasonal/use-season-moment"
import type { MomentSeason } from "@/shared/season-moments"

const NOLO_SIZE = 112
const BUBBLE_WIDTH = 280
const BURST_COUNT = 12
const BURST_RADIUS = 132
const BURST_SIZE = 22
const BURST_DELAY_S = 0.28
const BUBBLE_DELAY_S = 0.7
const FULL_TURN = 360
const BACKDROP = "fixed inset-0 z-[70] bg-tertiary/45 backdrop-blur-[4px] dark:bg-overlay/70"
const POP = { type: "spring", stiffness: 420, damping: 16 } as const
const SETTLE = { type: "spring", stiffness: 260, damping: 22 } as const

const GREETINGS: Record<MomentSeason, MessageKey> = {
  spring: "moment.spring",
  summer: "moment.summer",
  autumn: "moment.autumn",
  winter: "moment.winter",
  "new-year": "moment.newYear",
}

const burst = Array.from({ length: BURST_COUNT }, (_, index) => {
  const angle = (index / BURST_COUNT) * Math.PI * 2 - Math.PI / 2
  const reach = BURST_RADIUS * (index % 2 === 0 ? 1 : 0.72)
  return { index, x: Math.cos(angle) * reach, y: Math.sin(angle) * reach, rotate: (index % 3 === 0 ? -1 : 1) * FULL_TURN * 0.4 }
})

const Burst = ({ season }: { season: MomentSeason }) => {
  const shapes = SEASON_SHAPES[season]
  return (
    <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2">
      {burst.map((piece) => {
        const shape = shapes[piece.index % shapes.length]
        return (
          <m.svg
            key={piece.index}
            viewBox="0 0 24 24"
            width={BURST_SIZE}
            height={BURST_SIZE}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            initial={{ x: 0, y: 0, scale: 0.2, opacity: 0, rotate: 0 }}
            animate={{ x: piece.x, y: piece.y, scale: [0.2, 1.1, 1], opacity: [0, 1, 1, 0.85], rotate: piece.rotate }}
            transition={{ duration: 1.1, delay: BURST_DELAY_S + piece.index * 0.02, ease: [0.22, 1, 0.36, 1] }}
          >
            <path d={shape.d} fill={shape.fill} stroke={shape.fill} strokeWidth={1} strokeLinejoin="round" />
          </m.svg>
        )
      })}
    </div>
  )
}

const MomentScene = ({ season, onClose }: { season: MomentSeason; onClose: () => void }) => {
  const { t } = useI18n()
  const reduced = useReducedMotion() === true
  const [opened, setOpened] = useState(false)
  const [complete, setComplete] = useState(false)
  const [streamed, setStreamed] = useState(false)
  const countdown = season === "new-year" && !reduced
  const [introDone, setIntroDone] = useState(!countdown)
  const finishIntro = useCallback(() => setIntroDone(true), [])
  const greeting = season === "new-year" && reduced ? `${t("moment.newYearTitle")} ${t(GREETINGS[season])}` : t(GREETINGS[season])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <LazyMotion features={domAnimation} strict>
      <div role="dialog" aria-modal="true" aria-label={t("moment.label")}>
        <m.div className={BACKDROP} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
        <m.div
          className="fixed inset-0 z-[71] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {countdown && <NewYearFireworks />}
          {!introDone && <NewYearCountdown title={t("moment.newYearTitle")} onDone={finishIntro} />}
          {introDone && (
            <div className="relative flex flex-col items-center pt-40">
              {!reduced && <Burst season={season} />}
              <m.div
                className="absolute top-0 left-1/2 origin-bottom -translate-x-1/2 rounded-xl border border-line bg-surface p-4"
                style={{ width: BUBBLE_WIDTH }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.3, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={reduced ? { duration: 0.3, delay: 0.2 } : { ...SETTLE, delay: BUBBLE_DELAY_S }}
                onAnimationComplete={() => setOpened(true)}
              >
                <button type="button" className="block w-full cursor-default text-center" onClick={() => setComplete(true)}>
                  <p className="text-body-lg font-medium text-ink" aria-live="polite">
                    <StreamingText text={greeting} play={opened} complete={complete} charDelayMs={40} onDone={() => setStreamed(true)} />
                  </p>
                </button>
                <div className="mt-3 flex justify-center">
                  <Button size="sm" variant={streamed || complete ? "primary" : "ghost"} onClick={onClose} autoFocus>
                    {t("moment.dismiss")}
                  </Button>
                </div>
                <span aria-hidden className="absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-r border-b border-line bg-surface" />
              </m.div>
              <m.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 60, scale: 0.4 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, rotate: [0, -6, 5, -3, 0] }}
                transition={reduced ? { duration: 0.35 } : { ...POP, rotate: { duration: 0.7, delay: 0.3 } }}
              >
                <CostumedNolo costume={season} size={NOLO_SIZE} gaze="up" talking={opened && !streamed && !complete} />
              </m.div>
            </div>
          )}
        </m.div>
      </div>
    </LazyMotion>
  )
}

export const SeasonMoment = () => {
  const { state } = useExtensionState()
  const { seasonal } = useSeason()
  const { activeId } = useFeatureReveals()
  const { season, close } = useSeasonMoment(state.ready && seasonal && activeId === null)

  return createPortal(<AnimatePresence>{season && <MomentScene key={season} season={season} onClose={close} />}</AnimatePresence>, document.body)
}
