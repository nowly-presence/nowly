import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, domAnimation, LazyMotion, m, useReducedMotion } from "motion/react"
import { CostumedNolo } from "@/components/shared/nolo-costumed"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { useSeason } from "@/hooks/season-provider"
import { Button } from "@/ui/button"
import { StreamingText } from "@/ui/streaming-text"
import { HalloweenDoor } from "@/features/seasonal/halloween-door"
import { useHalloweenPrank } from "@/features/seasonal/use-halloween-prank"

type Phase = "door" | "boo" | "talk"

const BOO_MS = 1700
const REDUCED_BOO_MS = 1900
const NOLO_SIZE = 112
const BOO_SCALE = 2.2
const EMERGE_DELAY_S = 0.24
const TALK_SCALE = 1.15
const BUBBLE_WIDTH = 280
const DOOR_WIDTH = 248
const DOOR_HEIGHT = "min(400px, 62vh)"
const BACKDROP = "fixed inset-0 z-[70] bg-tertiary/50 backdrop-blur-[4px] dark:bg-overlay/70"
const POP = { type: "spring", stiffness: 560, damping: 13 } as const
const SETTLE = { type: "spring", stiffness: 260, damping: 22 } as const

const noloMotion = (phase: Phase, reduced: boolean) => {
  if (phase === "door") return { animate: { opacity: 0, y: 40, scale: 0.3 }, transition: { duration: 0 } }
  if (reduced) return { animate: { opacity: 1, y: 0, scale: TALK_SCALE }, transition: { duration: 0.35 } }
  if (phase === "boo") {
    return {
      animate: { opacity: 1, y: -10, scale: BOO_SCALE, rotate: [0, -9, 8, -5, 3, 0] },
      transition: { ...POP, delay: EMERGE_DELAY_S, opacity: { duration: 0.06, delay: EMERGE_DELAY_S }, rotate: { duration: 0.7, delay: EMERGE_DELAY_S + 0.15 } },
    }
  }
  return { animate: { opacity: 1, y: 0, scale: TALK_SCALE, rotate: 0 }, transition: SETTLE }
}

const PrankScene = ({ onClose }: { onClose: () => void }) => {
  const { t } = useI18n()
  const reduced = useReducedMotion() === true
  const [phase, setPhase] = useState<Phase>("door")
  const [opened, setOpened] = useState(false)
  const [complete, setComplete] = useState(false)
  const [streamed, setStreamed] = useState(false)

  useEffect(() => {
    if (phase !== "boo") return
    const timer = window.setTimeout(() => setPhase("talk"), reduced ? REDUCED_BOO_MS : BOO_MS)
    return () => window.clearTimeout(timer)
  }, [phase, reduced])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const nolo = noloMotion(phase, reduced)

  return (
    <LazyMotion features={domAnimation} strict>
      <div role="dialog" aria-modal="true" aria-label={t("prank.label")}>
        <m.div className={BACKDROP} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
        <m.div
          className="fixed inset-0 z-[71] flex flex-col items-center justify-center gap-5 px-4"
          initial={{ opacity: 0, scale: reduced ? 1 : 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative" style={{ width: DOOR_WIDTH, height: DOOR_HEIGHT }}>
            <AnimatePresence>
              {phase !== "talk" && (
                <m.div key="door" className="absolute inset-0" exit={{ opacity: 0, scale: reduced ? 1 : 0.9 }} transition={{ duration: 0.3 }}>
                  <HalloweenDoor open={phase !== "door"} reduced={reduced} label={t("prank.open")} onOpen={() => setPhase("boo")} />
                </m.div>
              )}
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div className="pointer-events-auto relative flex flex-col items-center">
                <AnimatePresence>
                  {phase === "boo" && (
                    <m.p
                      key="boo"
                      className="absolute bottom-full mb-32 text-headline-md font-bold whitespace-nowrap text-primary"
                      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.4, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={reduced ? { duration: 0.35 } : { ...POP, delay: EMERGE_DELAY_S + 0.1 }}
                    >
                      {t("prank.boo")}
                    </m.p>
                  )}
                  {phase === "talk" && (
                    <m.div
                      key="bubble"
                      className="absolute bottom-full mb-8 origin-bottom rounded-xl border border-line bg-surface p-4"
                      style={{ width: BUBBLE_WIDTH }}
                      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.3, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={reduced ? { duration: 0.3 } : { ...SETTLE, delay: 0.2 }}
                      onAnimationComplete={() => setOpened(true)}
                    >
                      <button type="button" className="block w-full cursor-default text-center" onClick={() => setComplete(true)}>
                        <p className="text-body-lg font-medium text-ink" aria-live="polite">
                          <StreamingText text={t("prank.trickOrTreat")} play={opened} complete={complete} charDelayMs={40} onDone={() => setStreamed(true)} />
                        </p>
                      </button>
                      <div className="mt-3 flex justify-center">
                        <Button size="sm" variant={streamed || complete ? "primary" : "ghost"} onClick={onClose} autoFocus>
                          {t("prank.dismiss")}
                        </Button>
                      </div>
                      <span aria-hidden className="absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-r border-b border-line bg-surface" />
                    </m.div>
                  )}
                </AnimatePresence>
                <m.div initial={{ opacity: 0, y: 40, scale: 0.3 }} animate={nolo.animate} transition={nolo.transition}>
                  <CostumedNolo costume="halloween" size={NOLO_SIZE} gaze="up" talking={phase === "talk" && opened && !streamed && !complete} />
                </m.div>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {phase === "door" && (
              <m.p
                key="hint"
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-label-lg font-medium text-ink"
                initial={{ opacity: 0, y: 6 }}
                animate={reduced ? { opacity: 1, y: 0 } : { opacity: [0.55, 1, 0.55], y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={reduced ? { duration: 0.3 } : { opacity: { duration: 1.6, repeat: Infinity, ease: "easeInOut" }, y: { duration: 0.3 } }}
              >
                {t("prank.knock")}
              </m.p>
            )}
          </AnimatePresence>
        </m.div>
      </div>
    </LazyMotion>
  )
}

export const HalloweenPrank = () => {
  const { state } = useExtensionState()
  const { seasonal } = useSeason()
  const { open, close } = useHalloweenPrank(state.ready && seasonal)

  return createPortal(<AnimatePresence>{open && <PrankScene key="prank" onClose={close} />}</AnimatePresence>, document.body)
}
