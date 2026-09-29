import { cn } from "@/ui/cn"

type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  size?: "md" | "sm"
  className?: string
  id?: string
}

export const Switch = ({ checked, onChange, label, disabled, size = "md", className, id }: SwitchProps) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={(event) => {
      event.stopPropagation()
      onChange(!checked)
    }}
    className={cn(
      "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-40",
      size === "md" ? "h-5 w-8" : "h-4 w-7",
      checked ? "bg-primary" : "bg-line-strong",
      className,
    )}
  >
    <span
      className={cn(
        "absolute rounded-full bg-white transition-transform duration-200 ease-out-soft",
        size === "md" ? "top-0.5 left-0.5 size-4" : "top-0.5 left-0.5 size-3",
        checked && (size === "md" ? "translate-x-3" : "translate-x-3"),
      )}
    />
  </button>
)
