import { m } from "motion/react"

type HalloweenDoorProps = {
  open: boolean
  reduced: boolean
  label: string
  onOpen: () => void
}

const ARCH = "rounded-t-[124px] rounded-b-lg"
const SWING = { duration: 0.26, ease: [0.55, 0, 0.9, 0.4] } as const
const PULSE = { duration: 1.3, repeat: Infinity, ease: "easeOut" } as const
const GLOW = { duration: 0.9, repeat: Infinity, ease: "easeInOut" } as const

export const HalloweenDoor = ({ open, reduced, label, onOpen }: HalloweenDoorProps) => (
  <>
    <div className={`absolute inset-0 border-[6px] border-door-edge bg-doorway ${ARCH}`} />
    <m.div
      className={`absolute inset-0 z-10 overflow-hidden border-[6px] border-door-edge bg-door ${ARCH}`}
      style={{ originX: 0, transformPerspective: 900, backfaceVisibility: "hidden" }}
      initial={false}
      animate={reduced ? { opacity: open ? 0 : 1 } : { rotateY: open ? -110 : 0 }}
      transition={reduced ? { duration: 0.2 } : SWING}
    >
      <span aria-hidden className="absolute inset-x-5 top-6 h-[40%] rounded-t-full border-2 border-door-edge bg-door-panel" />
      <span aria-hidden className="absolute inset-x-5 bottom-6 h-[34%] rounded-md border-2 border-door-edge bg-door-panel" />
      <button
        type="button"
        aria-label={label}
        autoFocus
        disabled={open}
        onClick={onOpen}
        className="absolute top-[52%] right-2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-door-handle"
      >
        {!reduced && !open && (
          <m.span
            aria-hidden
            className="absolute inset-1 rounded-full border-2 border-door-handle"
            animate={{ opacity: [0.9, 0], scale: [0.6, 1.5] }}
            transition={PULSE}
          />
        )}
        <span aria-hidden className="absolute h-9 w-3 rounded-full bg-door-edge" />
        <m.span
          aria-hidden
          className="relative size-5 rounded-full bg-door-handle"
          animate={!reduced && !open ? { opacity: [1, 0.55, 1], scale: [1, 1.12, 1] } : { opacity: 1, scale: 1 }}
          transition={!reduced && !open ? GLOW : { duration: 0.2 }}
        />
      </button>
    </m.div>
  </>
)
