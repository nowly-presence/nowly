import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, m } from "motion/react"

const COUNT = [3, 2, 1] as const
const TICK_MS = 800
const START_MS = 250
const TITLE_MS = 1900
const POP = { type: "spring", stiffness: 520, damping: 16 } as const

const ROCKETS = [
  { left: 22, apex: 26, delay: 2.2 },
  { left: 72, apex: 20, delay: 2.5 },
  { left: 48, apex: 14, delay: 2.85 },
  { left: 30, apex: 38, delay: 3.4 },
  { left: 66, apex: 34, delay: 3.7 },
  { left: 50, apex: 24, delay: 4.3 },
  { left: 18, apex: 18, delay: 4.9 },
  { left: 80, apex: 28, delay: 5.2 },
] as const

const SPARKS = 20
const SPARK_REACH = 92
const CLIMB_S = 0.9
const BURST_S = 1.1
const TONES = ["var(--primary)", "var(--season-accent)", "var(--tertiary-accent)", "var(--season-shape)"] as const

export const NEW_YEAR_INTRO_MS = START_MS + COUNT.length * TICK_MS + TITLE_MS

const sparks = Array.from({ length: SPARKS }, (_, index) => {
  const angle = (index / SPARKS) * Math.PI * 2
  const reach = SPARK_REACH * (index % 3 === 0 ? 1 : 0.78)
  return { index, x: Math.cos(angle) * reach, y: Math.sin(angle) * reach }
})

const Rocket = ({ left, apex, delay, tone, rise }: { left: number; apex: number; delay: number; tone: string; rise: number }) => (
  <div className="absolute" style={{ left: `${left}%`, top: `${apex}%` }}>
    <m.span
      className="absolute -left-0.5 block h-8 w-1 rounded-full"
      style={{ background: tone }}
      initial={{ y: rise, opacity: 0 }}
      animate={{ y: [rise, 0], opacity: [0, 1, 1, 0] }}
      transition={{ duration: CLIMB_S, delay, ease: [0.2, 0.7, 0.4, 1], times: [0, 0.1, 0.85, 1] }}
    />
    {sparks.map((spark) => (
      <m.span
        key={spark.index}
        className="absolute -top-1.5 -left-1.5 block size-3 rounded-full"
        style={{ background: spark.index % 2 === 0 ? tone : "var(--on-tertiary)" }}
        initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
        animate={{ x: spark.x, y: [0, spark.y, spark.y + SPARK_REACH * 0.35], scale: [0, 1.1, 0.4], opacity: [0, 1, 0] }}
        transition={{ duration: BURST_S, delay: delay + CLIMB_S, ease: "easeOut" }}
      />
    ))}
  </div>
)

export const NewYearFireworks = () => {
  const rise = useMemo(() => window.innerHeight * 0.85, [])
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[71] overflow-hidden">
      {ROCKETS.map((rocket, index) => (
        <Rocket key={`${rocket.left}-${rocket.delay}`} {...rocket} tone={TONES[index % TONES.length]} rise={rise} />
      ))}
    </div>
  )
}

export const NewYearCountdown = ({ title, onDone }: { title: string; onDone: () => void }) => {
  const [step, setStep] = useState(-1)

  useEffect(() => {
    const timers = COUNT.map((_, index) => window.setTimeout(() => setStep(index), START_MS + index * TICK_MS))
    timers.push(window.setTimeout(() => setStep(COUNT.length), START_MS + COUNT.length * TICK_MS))
    timers.push(window.setTimeout(onDone, NEW_YEAR_INTRO_MS))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [onDone])

  return (
    <button type="button" className="fixed inset-0 z-[72] flex cursor-default items-center justify-center" onClick={onDone}>
      <AnimatePresence mode="popLayout">
        {step >= 0 && step < COUNT.length && (
          <m.span
            key={COUNT[step]}
            aria-hidden
            className="block text-countdown font-bold text-primary"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.6, transition: { duration: 0.25 } }}
            transition={POP}
          >
            {COUNT[step]}
          </m.span>
        )}
        {step === COUNT.length && (
          <m.span
            key="title"
            className="block px-6 text-center text-headline-md font-bold text-primary"
            aria-live="polite"
            initial={{ opacity: 0, scale: 0.4, y: 10 }}
            animate={{ opacity: 1, scale: [0.4, 1.12, 1], y: 0 }}
            exit={{ opacity: 0, y: -16, transition: { duration: 0.3 } }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {title}
          </m.span>
        )}
      </AnimatePresence>
    </button>
  )
}
