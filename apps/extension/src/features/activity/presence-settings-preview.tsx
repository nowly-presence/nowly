import { resolveLocaleString } from "@/features/activity/presence-locale"
import { SettingRow } from "@/features/settings/setting-row"
import { Input } from "@/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Slider } from "@/ui/slider"
import { Switch } from "@/ui/switch"

type SettingDefinition = Record<string, unknown> & { default?: unknown; description?: unknown; type?: string }

type Props = {
  definitions?: Record<string, unknown>
}

const inferType = (value: unknown): string => {
  if (typeof value === "boolean") return "boolean"
  if (typeof value === "string") return "input"
  if (typeof value === "number") return "slider"
  return "unknown"
}

export const PresenceSettingsPreview = ({ definitions }: Props): React.JSX.Element | null => {
  if (!definitions || Object.keys(definitions).length === 0) return null

  return (
    <div className="divide-y divide-border">
      {Object.entries(definitions).map(([key, definition]) => {
        const def = typeof definition === "object" && definition !== null ? (definition as SettingDefinition) : null
        const type = def?.type ?? inferType(definition)
        const label = resolveLocaleString(def?.label) ?? key
        const description = resolveLocaleString(def?.description)
        const fieldId = `preview-${key}`

        if (type === "boolean") {
          return (
            <SettingRow
              key={key}
              title={label}
              description={description}
              controlId={fieldId}
              control={
                <Switch
                  id={fieldId}
                  disabled
                  checked={Boolean(def?.default)}
                />
              }
            />
          )
        }

        if (type === "input") {
          return (
            <SettingRow
              key={key}
              title={label}
              description={description}
              controlId={fieldId}
            >
              <Input
                id={fieldId}
                disabled
                value={String(def?.default ?? "")}
                placeholder={resolveLocaleString(def?.placeholder) ?? ""}
                readOnly
              />
            </SettingRow>
          )
        }

        if (type === "select") {
          const options = (def?.options as Array<Record<string, unknown>> | undefined) ?? []
          return (
            <SettingRow
              key={key}
              title={label}
              description={description}
              controlId={fieldId}
            >
              <Select
                disabled
                value={String(def?.default ?? "")}
                items={Object.fromEntries(
                  options.map((option) => {
                    const value = String(option.value ?? "")
                    return [value, resolveLocaleString(option.label) ?? value]
                  }),
                )}
              >
                <SelectTrigger
                  id={fieldId}
                  size="sm"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => {
                    const value = String(option.value ?? "")
                    return (
                      <SelectItem
                        key={value}
                        value={value}
                      >
                        {resolveLocaleString(option.label) ?? value}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </SettingRow>
          )
        }

        return (
          <SettingRow
            key={key}
            title={label}
            description={description}
            controlId={fieldId}
          >
            <div className="flex items-center gap-2">
              <Slider
                id={fieldId}
                disabled
                min={Number(def?.min ?? 0)}
                max={Number(def?.max ?? 100)}
                step={Number(def?.step ?? 1)}
                value={[Number(def?.default ?? 0)]}
              />
              <span className="w-8 text-right text-sm text-muted-foreground">{String(def?.default ?? 0)}</span>
            </div>
          </SettingRow>
        )
      })}
    </div>
  )
}
