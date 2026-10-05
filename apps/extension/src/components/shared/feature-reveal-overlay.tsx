import { useState } from "react"
import { domAnimation, LazyMotion, m } from "motion/react"
import { CostumedNolo } from "@/components/shared/nolo-costumed"
import type { NoloCostume } from "@/components/shared/nolo-costume-paths"
import { useI18n } from "@/hooks/i18n-provider"
import { useSeason } from "@/hooks/season-provider"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { StreamingText } from "@/ui/streaming-text"

export type SpotRect = { x: number; y: number; width: number; height: number }

const SPOT_PADDING = 5
const SPOT_RADIUS = 14
const CALLOUT_GAP = 16
const CALLOUT_WIDTH = 248
const VIEWPORT_MARGIN = 12
const ARROW_SIZE = 12
const BUBBLE_DELAY_S = 0.35
const DOCK_CLEARANCE = 84

const useCostume = (): NoloCostume | null => useSeason().season

const BACKDROP = "fixed inset-0 z-[60] bg-tertiary/40 backdrop-blur-[3px] dark:bg-overlay/65"
const SPRING = { type: "spring", stiffness: 380, damping: 28 } as const

const spotBox = (rect: SpotRect): SpotRect => ({
  x: rect.x - SPOT_PADDING,
  y: rect.y - SPOT_PADDING,
  width: rect.width + SPOT_PADDING * 2,
  height: rect.height + SPOT_PADDING * 2,
})

const holePath = ({ x, y, width, height }: SpotRect, viewport: { width: number; height: number }): string => {
  const r = Math.min(SPOT_RADIUS, width / 2, height / 2)
  const outer = `M0 0H${viewport.width}V${viewport.height}H0Z`
  const hole = `M${x + r} ${y}H${x + width - r}A${r} ${r} 0 0 1 ${x + width} ${y + r}V${y + height - r}A${r} ${r} 0 0 1 ${x + width - r} ${y + height}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + height - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  return `path(evenodd, "${outer} ${hole}")`
}

export const FeatureRevealSpotlight = ({ rect, hint, onSkip }: { rect: SpotRect; hint?: string; onSkip: () => void }) => {
  const { t } = useI18n()
  const costume = useCostume()
  const box = spotBox(rect)
  const viewport = { width: window.innerWidth, height: window.innerHeight }
  const centerX = rect.x + rect.width / 2
  const left = Math.min(Math.max(VIEWPORT_MARGIN, centerX - CALLOUT_WIDTH / 2), viewport.width - CALLOUT_WIDTH - VIEWPORT_MARGIN)
  const arrowLeft = Math.min(Math.max(SPOT_RADIUS, centerX - left - ARROW_SIZE / 2), CALLOUT_WIDTH - SPOT_RADIUS - ARROW_SIZE)
  const radius = { borderRadius: SPOT_RADIUS }

  return (
    <LazyMotion features={domAnimation} strict>
      <div role="dialog" aria-modal="true" aria-label={hint ?? t("reveal.tapHere")}>
        <m.div
          className={BACKDROP}
          style={{ clipPath: holePath(box, viewport) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        />
        <div
          className="pointer-events-none fixed z-[61]"
          style={{
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
          }}
        >
          <m.span
            className="absolute inset-0 border-2 border-primary"
            style={radius}
            initial={{ opacity: 0, scale: 1.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING}
          />
          <m.span
            className="absolute inset-0 border-2 border-primary"
            style={radius}
            animate={{ opacity: [0.7, 0], scale: [1, 1.25] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        </div>
        <m.div
          className="fixed z-[61] flex flex-col gap-3 rounded-lg border border-line bg-surface p-3"
          style={{
            left,
            bottom: viewport.height - box.y + CALLOUT_GAP,
            width: CALLOUT_WIDTH,
            transformOrigin: `${arrowLeft + ARROW_SIZE / 2}px 100%`,
          }}
          initial={{ opacity: 0, y: 8, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.94 }}
          transition={{ ...SPRING, delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <CostumedNolo costume={costume} size={36} gaze="down" />
            <div className="flex min-w-0 flex-col items-start gap-1">
              <Badge tone="primary">{t("reveal.new")}</Badge>
              <p className="text-label-lg font-medium text-ink">{hint ?? t("reveal.tapHere")}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="self-end" onClick={onSkip}>
            {t("reveal.skip")}
          </Button>
          <span
            aria-hidden
            className="absolute -bottom-[7px] rotate-45 border-r border-b border-line bg-surface"
            style={{ left: arrowLeft, width: ARROW_SIZE, height: ARROW_SIZE }}
          />
        </m.div>
      </div>
    </LazyMotion>
  )
}

export const FeatureRevealExplain = ({ text, onDone }: { text: string; onDone: () => void }) => {
  const { t } = useI18n()
  const costume = useCostume()
  const [opened, setOpened] = useState(false)
  const [complete, setComplete] = useState(false)
  const [streamed, setStreamed] = useState(false)
  const talking = opened && !streamed && !complete

  return (
    <LazyMotion features={domAnimation} strict>
      <div role="dialog" aria-modal="true" aria-label={t("reveal.new")}>
        <m.div className={BACKDROP} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
        <div className="fixed inset-x-0 z-[61] flex justify-center px-4" style={{ bottom: DOCK_CLEARANCE }}>
          <div className="flex w-full max-w-[360px] flex-col items-start gap-3">
            <m.div
              className="relative w-full origin-bottom-left rounded-xl border border-line bg-surface p-4"
              initial={{ opacity: 0, scale: 0.2, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.4, y: 12 }}
              transition={{ ...SPRING, delay: BUBBLE_DELAY_S }}
              onAnimationComplete={() => setOpened(true)}
            >
              <button type="button" className="block w-full cursor-default text-left" onClick={() => setComplete(true)}>
                <p className="text-body-sm text-ink" aria-live="polite">
                  <StreamingText text={text} play={opened} complete={complete} onDone={() => setStreamed(true)} />
                </p>
              </button>
              <div className="mt-3 flex items-center justify-end gap-2">
                {streamed || complete ? (
                  <Button size="sm" onClick={onDone}>
                    {t("reveal.gotIt")}
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={onDone}>
                    {t("reveal.skip")}
                  </Button>
                )}
              </div>
              <span aria-hidden className="absolute -bottom-[7px] left-7 size-3 rotate-45 border-r border-b border-line bg-surface" />
            </m.div>
            <m.div
              className="pl-2"
              initial={{ opacity: 0, y: 60, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              <CostumedNolo costume={costume} size={64} gaze="up" talking={talking} />
            </m.div>
          </div>
        </div>
      </div>
    </LazyMotion>
  )
}
