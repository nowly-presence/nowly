import { useSeason } from "@/hooks/season-provider"
import { cn } from "@/ui/cn"

const BAT =
  "M12 9.2c-.5 0-.9.2-1.2.5L10.2 8l-.3 1.9C8.9 8.8 7.3 8.1 5.6 8.1 4.1 8.1 2.7 8.9 2 10.2c1.2-.2 2.3.2 3 1-.9.1-1.6.6-2 1.4 1.4-.4 2.8 0 3.8.9.6-.9 1.6-1.4 2.7-1.3.4.8.9 1.3 1.5 1.5.6-.2 1.1-.7 1.5-1.5 1.1-.1 2.1.4 2.7 1.3 1-.9 2.4-1.3 3.8-.9-.4-.8-1.1-1.3-2-1.4.7-.8 1.8-1.2 3-1-.7-1.3-2.1-2.1-3.6-2.1-1.7 0-3.3.7-4.3 1.8L13.8 8l-.6 1.7c-.3-.3-.7-.5-1.2-.5z"
const PUMPKIN =
  "M12 7.4c-1.2-.8-3.2-.9-4.6-.2C5.3 8.1 4 10.2 4 12.9s1.6 5.1 4 5.7c1.3.4 2.8.2 4-.3 1.2.5 2.7.7 4 .3 2.4-.6 4-3.1 4-5.7s-1.3-4.8-3.4-5.7c-1.4-.7-3.4-.6-4.6.2z"
const STEM = "M11.3 7.6c-.1-1.6.4-3 1.7-3.9l1 1c-.9.6-1.3 1.6-1.2 2.9z"

const Bat = ({ className }: { className: string }) => (
  <svg viewBox="0 0 24 24" className={cn("absolute text-season-accent motion-safe:animate-season-float", className)} fill="currentColor">
    <path d={BAT} />
  </svg>
)

export const SeasonalDecor = () => {
  const { season } = useSeason()
  if (season !== "halloween") return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
      <Bat className="top-3 left-4 size-7 -rotate-12" />
      <Bat className="top-7 right-6 size-5 rotate-6 [animation-delay:1.2s]" />
      <svg viewBox="0 0 24 24" className="absolute bottom-3 left-4 size-8">
        <path d={PUMPKIN} fill="var(--season-shape)" />
        <path d={STEM} fill="var(--season-accent)" />
      </svg>
    </div>
  )
}
