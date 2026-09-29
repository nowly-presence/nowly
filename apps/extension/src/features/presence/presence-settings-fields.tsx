import { useEffect, useState } from "react"
import { Input } from "@/ui/input"
import { Slider } from "@/ui/slider"
import { Select } from "@/ui/select"
import { FieldRow } from "@/ui/field-row"
import { SwitchRow } from "@/ui/row"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import { useI18n } from "@/hooks/i18n-provider"
import { localized } from "@/lib/presence-view"

type LocaleString = Partial<Record<string, string>>
type Definition =
  | { type: "boolean"; default: boolean; label: LocaleString; description?: LocaleString }
  | { type: "input"; default: string; label: LocaleString; description?: LocaleString; placeholder?: LocaleString }
  | { type: "select"; default: string; label: LocaleString; description?: LocaleString; options: { value: string; label: LocaleString }[] }
  | { type: "slider"; default: number; label: LocaleString; description?: LocaleString; min?: number; max?: number; step?: number }

const humanize = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase())

const DEFINITION_TYPES: readonly string[] = ["boolean", "input", "select", "slider"]

const isDefinition = (value: unknown): value is Definition =>
  typeof value === "object" && value !== null && "type" in value && typeof value.type === "string" && DEFINITION_TYPES.includes(value.type)

export const normalizeDefinitions = (raw: Record<string, unknown> | undefined): [string, Definition][] => {
  if (!raw) return []
  return Object.entries(raw).flatMap(([key, value]): [string, Definition][] => {
    if (typeof value === "boolean") return [[key, { type: "boolean", default: value, label: { "en-US": humanize(key) } }]]
    if (typeof value === "string") return [[key, { type: "input", default: value, label: { "en-US": humanize(key) } }]]
    if (typeof value === "number") return [[key, { type: "slider", default: value, label: { "en-US": humanize(key) } }]]
    if (isDefinition(value)) return [[key, { ...value, label: value.label ?? { "en-US": humanize(key) } }]]
    return []
  })
}

const InputSetting = ({ value, placeholder, label, onCommit }: { value: string; placeholder?: string; label: string; onCommit: (value: string) => void }) => {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const commit = useDebouncedCallback(onCommit, 500)
  return (
    <Input
      value={draft}
      placeholder={placeholder}
      aria-label={label}
      onChange={(event) => {
        setDraft(event.target.value)
        commit(event.target.value)
      }}
    />
  )
}

export const PresenceSettingsList = ({
  definitions,
  values,
  onChange,
}: {
  definitions: [string, Definition][]
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) => {
  const { locale } = useI18n()

  return (
    <>
      {definitions.map(([key, definition]) => {
        const label = localized(definition.label, locale, humanize(key))
        const description = definition.description ? localized(definition.description, locale) : undefined
        const current = values[key] ?? definition.default

        if (definition.type === "boolean") {
          return (
            <SwitchRow
              key={key}
              align="start"
              title={<span className="whitespace-normal">{label}</span>}
              description={description}
              checked={current === true}
              label={label}
              onChange={(checked) => onChange(key, checked)}
            />
          )
        }

        return (
          <FieldRow key={key} title={label} description={description} layout="stacked">
            {definition.type === "input" && (
              <InputSetting
                value={String(current ?? "")}
                placeholder={definition.placeholder ? localized(definition.placeholder, locale) : undefined}
                label={label}
                onCommit={(value) => onChange(key, value)}
              />
            )}
            {definition.type === "select" && (
              <Select
                aria-label={label}
                value={String(current)}
                onChange={(value) => onChange(key, value)}
                options={definition.options.map((option) => ({ value: option.value, label: localized(option.label, locale, option.value) }))}
              />
            )}
            {definition.type === "slider" && (
              <Slider
                label={label}
                value={Number(current)}
                min={definition.min ?? 0}
                max={definition.max ?? 100}
                step={definition.step ?? 1}
                onChange={(value) => onChange(key, value)}
              />
            )}
          </FieldRow>
        )
      })}
    </>
  )
}
