import { cn } from "@/ui/cn"

type SegmentedProps<T extends string> = {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
  className?: string
}

export const Segmented = <T extends string>({ value, options, onChange, label, className }: SegmentedProps<T>) => (
  <div role="radiogroup" aria-label={label} className={cn("flex rounded-md border border-line bg-canvas p-0.5", className)}>
    {options.map((option) => {
      const active = option.value === value
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 flex-1 rounded-[8px] px-2 text-label-md font-medium whitespace-nowrap transition-colors duration-150",
            active ? "bg-surface text-ink shadow-[0_0_0_1px_var(--muted-border)]" : "text-muted hover:text-ink",
          )}
        >
          {option.label}
        </button>
      )
    })}
  </div>
)
