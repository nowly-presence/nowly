type SliderProps = { value: number; min: number; max: number; step: number; onChange: (value: number) => void; label: string }

export const Slider = ({ value, min, max, step, onChange, label }: SliderProps) => {
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        style={{ background: `linear-gradient(to right, var(--primary) ${percent}%, var(--subtle-border) ${percent}%)` }}
      />
      <span className="w-9 text-right text-label-md text-muted tabular-nums">{value}</span>
    </div>
  )
}
