"use client";

import { Field, FieldLabel, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nowly/ui";
import { ANALYTICS_SOURCES } from "@nowly/analytics";
import type { InsightsFilters } from "@nowly/analytics";

const textFields: Array<{ key: keyof InsightsFilters; label: string; placeholder: string }> = [
  { key: "slug", label: "Slug", placeholder: "youtube" },
  { key: "country", label: "Country", placeholder: "FR" },
  { key: "browser", label: "Browser", placeholder: "firefox" },
  { key: "os", label: "OS", placeholder: "windows" },
  { key: "locale", label: "Locale", placeholder: "en-US" },
];

export const FilterFields = ({
  filters,
  onChange,
}: {
  filters: InsightsFilters;
  onChange: (filters: InsightsFilters) => void;
}) => {
  const setField = (key: keyof InsightsFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field>
        <FieldLabel>Source</FieldLabel>
        <Select
          value={filters.source ?? ""}
          onValueChange={(value) => setField("source", value ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {ANALYTICS_SOURCES.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {textFields.map((field) => (
        <Field key={field.key}>
          <FieldLabel>{field.label}</FieldLabel>
          <Input
            value={filters[field.key] ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => setField(field.key, e.target.value)}
          />
        </Field>
      ))}
    </div>
  );
};
