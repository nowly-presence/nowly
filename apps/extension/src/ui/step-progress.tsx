import { cn } from "@/ui/cn";

export const StepProgress = ({ total, current, label }: { total: number; current: number; label: string }) => (
  <div className="flex items-center gap-1" role="progressbar" aria-label={label} aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1}>
    {Array.from({ length: total }, (_, position) => (
      <span
        key={position}
        className={cn(
          "h-1 rounded-full transition-all duration-300",
          position === current ? "w-5 bg-primary" : position < current ? "w-2 bg-ink/40" : "w-2 bg-line-strong"
        )}
      />
    ))}
  </div>
);