import { useId, type ReactNode } from "react"
import { RiArrowRightSLine } from "@remixicon/react"
import { cn } from "@/ui/cn"
import { Switch } from "@/ui/switch"

type RowProps = {
  title: ReactNode
  description?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  chevron?: boolean
  className?: string
  align?: "center" | "start"
}

export const Row = ({ title, description, leading, trailing, onClick, chevron, className, align = "center" }: RowProps) => {
  const content = (
    <>
      {leading && <span className={cn("flex shrink-0", align === "start" && "mt-0.5")}>{leading}</span>}
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="truncate text-label-lg font-medium text-ink">{title}</span>
        {description && <span className="text-label-md font-normal text-muted">{description}</span>}
      </span>
      {trailing && <span className="flex shrink-0 items-center gap-2">{trailing}</span>}
      {chevron && <RiArrowRightSLine className="size-4 shrink-0 text-muted" />}
    </>
  )
  const base = cn(
    "flex w-full gap-3 px-4 py-3",
    align === "center" ? "items-center" : "items-start",
    className,
  )
  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onClick()
          }
        }}
        className={cn(base, "cursor-pointer transition-colors duration-150 hover:bg-hover active:bg-press")}
      >
        {content}
      </div>
    )
  }
  return <div className={base}>{content}</div>
}

type SwitchRowProps = {
  title: ReactNode
  description?: ReactNode
  leading?: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  align?: "center" | "start"
}

export const SwitchRow = ({ title, description, leading, checked, onChange, label, disabled, align = "center" }: SwitchRowProps) => {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex w-full gap-3 px-4 py-3 transition-colors duration-150",
        align === "center" ? "items-center" : "items-start",
        disabled ? "cursor-default opacity-60" : "cursor-pointer hover:bg-hover active:bg-press",
      )}
    >
      {leading && <span className={cn("flex shrink-0", align === "start" && "mt-0.5")}>{leading}</span>}
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="text-label-lg font-medium text-ink">{title}</span>
        {description && <span className="text-label-md font-normal text-muted">{description}</span>}
      </span>
      <Switch id={id} checked={checked} onChange={onChange} label={label} disabled={disabled} className={align === "start" ? "mt-0.5" : undefined} />
    </label>
  )
}
