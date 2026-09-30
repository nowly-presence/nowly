import { useEffect, useState } from "react"
import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react"
import { NOLO_EYE_WHITES, NOLO_EYES_AXIS_Y, NOLO_GLINTS, NOLO_PUPILS, NOLO_VIEWBOX } from "@/components/shared/nolo-paths"
import { cn } from "@/ui/cn"

export type NoloGaze = "up" | "down"

type NoloMascotProps = {
  size?: number
  gaze?: NoloGaze
  talking?: boolean
  className?: string
}

const EYE_WHITE = "#ffffff"
const PUPIL = "#000000"
const GLINT = "#ffff7e"
const BLINK_MS = 150
const BLINK_MIN_DELAY_MS = 1800
const BLINK_EXTRA_DELAY_MS = 3200
const DOUBLE_BLINK_CHANCE = 0.25
const DOUBLE_BLINK_GAP_MS = 260
const LOOK_MIN_DELAY_MS = 1400
const LOOK_EXTRA_DELAY_MS = 2600
const LOOK_RANGE = 10
const CENTER = NOLO_VIEWBOX / 2
const TALK_SCALE = 1.035
const TALK_BEAT_S = 0.32

const useBlink = (enabled: boolean): boolean => {
  const [closed, setClosed] = useState(false)
  useEffect(() => {
    if (!enabled) return
    const timers: number[] = []
    const blinkOnce = (after: number) =>
      timers.push(
        window.setTimeout(() => {
          setClosed(true)
          timers.push(window.setTimeout(() => setClosed(false), BLINK_MS))
        }, after),
      )
    const schedule = () => {
      const delay = BLINK_MIN_DELAY_MS + Math.random() * BLINK_EXTRA_DELAY_MS
      blinkOnce(delay)
      if (Math.random() < DOUBLE_BLINK_CHANCE) blinkOnce(delay + BLINK_MS + DOUBLE_BLINK_GAP_MS)
      timers.push(window.setTimeout(schedule, delay + BLINK_MS * 2 + DOUBLE_BLINK_GAP_MS))
    }
    schedule()
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [enabled])
  return closed
}

const useLookAround = (enabled: boolean): { x: number; y: number } => {
  const [look, setLook] = useState({ x: 0, y: 0 })
  useEffect(() => {
    if (!enabled) return setLook({ x: 0, y: 0 })
    let timer = 0
    const move = () => {
      const centered = Math.random() < 0.35
      setLook(
        centered
          ? { x: 0, y: 0 }
          : {
              x: (Math.random() * 2 - 1) * LOOK_RANGE,
              y: (Math.random() * 2 - 1) * LOOK_RANGE * 0.6,
            },
      )
      timer = window.setTimeout(move, LOOK_MIN_DELAY_MS + Math.random() * LOOK_EXTRA_DELAY_MS)
    }
    timer = window.setTimeout(move, LOOK_MIN_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [enabled])
  return look
}

export const NoloMascot = ({ size = 56, gaze = "up", talking = false, className }: NoloMascotProps) => {
  const reduced = useReducedMotion() === true
  const closed = useBlink(!reduced)
  const look = useLookAround(!reduced && !talking)
  const origin = {
    transformBox: "view-box",
    transformOrigin: `${CENTER}px ${NOLO_EYES_AXIS_Y}px`,
  } as const

  return (
    <LazyMotion features={domAnimation} strict>
      <m.svg
        viewBox={`0 0 ${NOLO_VIEWBOX} ${NOLO_VIEWBOX}`}
        width={size}
        height={size}
        aria-hidden
        className={cn("shrink-0 overflow-visible", className)}
        animate={!reduced && talking ? { scale: [1, TALK_SCALE, 1] } : { scale: 1 }}
        transition={talking ? { duration: TALK_BEAT_S, repeat: Infinity, ease: "easeInOut" } : { duration: TALK_BEAT_S }}
      >
        <circle cx={CENTER} cy={CENTER} r={CENTER} fill="var(--primary)" />
        <m.g style={origin} initial={false} animate={{ scaleY: gaze === "up" ? 1 : -1 }} transition={{ type: "spring", stiffness: 420, damping: 26 }}>
          <m.g style={origin} animate={{ scaleY: closed ? 0.08 : 1 }} transition={{ duration: BLINK_MS / 2000, ease: "easeInOut" }}>
            {NOLO_EYE_WHITES.map((path) => (
              <path key={path.slice(0, 24)} d={path} fill={EYE_WHITE} />
            ))}
            <m.g animate={{ x: look.x, y: look.y }} transition={{ type: "spring", stiffness: 160, damping: 18 }}>
              {NOLO_PUPILS.map((path) => (
                <path key={path.slice(0, 24)} d={path} fill={PUPIL} />
              ))}
              {NOLO_GLINTS.map((path) => (
                <path key={path.slice(0, 24)} d={path} fill={GLINT} />
              ))}
            </m.g>
          </m.g>
        </m.g>
      </m.svg>
    </LazyMotion>
  )
}
