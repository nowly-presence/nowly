import { useCallback, useEffect, useRef } from "react"

export const useDebouncedCallback = <T extends unknown[]>(callback: (...args: T) => void, delay: number) => {
  const timer = useRef<number | null>(null)
  const latest = useRef(callback)
  latest.current = callback
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
  }, [])
  return useCallback(
    (...args: T) => {
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => latest.current(...args), delay)
    },
    [delay],
  )
}
