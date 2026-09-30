import { useEffect, useMemo, useState } from "react"
import { cn } from "@/ui/cn"

type StreamingTextProps = {
  text: string
  play: boolean
  complete?: boolean
  charDelayMs?: number
  onDone?: () => void
  className?: string
}

const DEFAULT_CHAR_DELAY_MS = 24
const PAUSE_CHARS = /[.,!?;:。，！？]/
const PAUSE_FACTOR = 7

const splitGraphemes = (text: string): string[] =>
  typeof Intl.Segmenter === "function" ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (part) => part.segment) : Array.from(text)

export const StreamingText = ({ text, play, complete = false, charDelayMs = DEFAULT_CHAR_DELAY_MS, onDone, className }: StreamingTextProps) => {
  const graphemes = useMemo(() => splitGraphemes(text), [text])
  const [count, setCount] = useState(0)
  const shown = complete ? graphemes.length : count
  const done = shown >= graphemes.length

  useEffect(() => setCount(0), [text])

  useEffect(() => {
    if (!play || done) return
    const previous = graphemes[shown - 1] ?? ""
    const timer = window.setTimeout(() => setCount((value) => value + 1), PAUSE_CHARS.test(previous) ? charDelayMs * PAUSE_FACTOR : charDelayMs)
    return () => window.clearTimeout(timer)
  }, [play, done, shown, graphemes, charDelayMs])

  useEffect(() => {
    if (done && play) onDone?.()
  }, [done, play, onDone])

  return (
    <span className={cn("whitespace-pre-line", className)} aria-label={text}>
      <span aria-hidden>{graphemes.slice(0, shown).join("")}</span>
      <span aria-hidden className="opacity-0">
        {graphemes.slice(shown).join("")}
      </span>
    </span>
  )
}
