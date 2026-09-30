import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react"
import { NoloMascot, type NoloGaze } from "@/components/shared/nolo-mascot"
import { NOLO_COSTUMES, type NoloCostume } from "@/components/shared/nolo-costume-paths"
import { NOLO_VIEWBOX } from "@/components/shared/nolo-paths"
import { cn } from "@/ui/cn"

type CostumedNoloProps = {
  costume?: NoloCostume | null
  size?: number
  gaze?: NoloGaze
  talking?: boolean
  className?: string
}

const TALK_SCALE = 1.035
const TALK_BEAT_S = 0.32

export const CostumedNolo = ({ costume, size = 56, gaze, talking = false, className }: CostumedNoloProps) => {
  const reduced = useReducedMotion() === true
  if (!costume) return <NoloMascot size={size} gaze={gaze} talking={talking} className={className} />
  const art = NOLO_COSTUMES[costume]
  return (
    <LazyMotion features={domAnimation} strict>
      <span className={cn("relative inline-flex shrink-0", `nolo-costume-${costume}`, className)} style={{ paddingTop: Math.round(size * art.overhang) }}>
        <NoloMascot size={size} gaze={gaze} talking={talking} />
        <m.svg
          viewBox={`0 0 ${NOLO_VIEWBOX} ${NOLO_VIEWBOX}`}
          width={size}
          height={size}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 overflow-visible"
          style={{ transformOrigin: "50% 50%" }}
          animate={!reduced && talking ? { scale: [1, TALK_SCALE, 1] } : { scale: 1 }}
          transition={talking ? { duration: TALK_BEAT_S, repeat: Infinity, ease: "easeInOut" } : { duration: TALK_BEAT_S }}
        >
          <g transform={art.transform}>
            {art.layers.map((layer) => (
              <path key={layer.d.slice(0, 24)} d={layer.d} fill={layer.fill} />
            ))}
          </g>
        </m.svg>
      </span>
    </LazyMotion>
  )
}
