"use client";

import { FilterFields } from "@/components/views/filter-fields";
import { FUNNEL_IDS } from "@/lib/catalog";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nowly/ui";
import { ANALYTICS_RANGE_IDS, analyticsRegistry, type InsightsFilters, type WidgetConfig, type WidgetRange } from "@nowly/analytics";
import { useState } from "react";

type WidgetKind = WidgetConfig["kind"];
const KINDS: WidgetKind[] = ["metric-total", "metric-series", "funnel"];
const CHART_TYPES = ["line", "bar", "area"] as const;
const RANGE_OPTIONS: WidgetRange[] = [...ANALYTICS_RANGE_IDS, "custom"];
const metricKeys = analyticsRegistry.map((m) => m.key);

const toLocalInputValue = (iso?: string): string => (iso ? iso.slice(0, 16) : "");

const emptyWidget = (): WidgetConfig => ({
  id: crypto.randomUUID(),
  title: "",
  kind: "metric-series",
  metric: metricKeys[0] ?? "",
  filters: {},
  range: "7d",
  chartType: "line",
});

export const WidgetEditorDialog = ({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: WidgetConfig;
  onSave: (widget: WidgetConfig) => void;
}) => {
  const [widget, setWidget] = useState<WidgetConfig>(initial ?? emptyWidget());

  const setFilters = (filters: InsightsFilters) => setWidget({ ...widget, filters });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit widget" : "Add widget"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input value={widget.title} onChange={(e) => setWidget({ ...widget, title: e.target.value })} />
          </Field>

          <Field>
            <FieldLabel>Kind</FieldLabel>
            <Select
              value={widget.kind}
              onValueChange={(value) => {
                if (!value) return;
                const kind = value as WidgetKind;
                if (kind === "funnel") {
                  setWidget({ id: widget.id, title: widget.title, kind, funnelId: FUNNEL_IDS[0], filters: widget.filters, range: widget.range, from: widget.from, to: widget.to });
                } else if (kind === "metric-total") {
                  setWidget({ id: widget.id, title: widget.title, kind, metric: metricKeys[0] ?? "", filters: widget.filters, range: widget.range, from: widget.from, to: widget.to });
                } else {
                  setWidget({ id: widget.id, title: widget.title, kind, metric: metricKeys[0] ?? "", filters: widget.filters, range: widget.range, from: widget.from, to: widget.to, chartType: "line" });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {kind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {widget.kind === "funnel" ? (
            <Field>
              <FieldLabel>Funnel</FieldLabel>
              <Select value={widget.funnelId} onValueChange={(value) => value && setWidget({ ...widget, funnelId: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNNEL_IDS.map((id) => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <Field>
              <FieldLabel>Metric</FieldLabel>
              <Select value={widget.metric} onValueChange={(value) => value && setWidget({ ...widget, metric: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field>
            <FieldLabel>Range</FieldLabel>
            <Select value={widget.range} onValueChange={(value) => value && setWidget({ ...widget, range: value as WidgetRange })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((range) => (
                  <SelectItem key={range} value={range}>
                    {range === "custom" ? "Custom dates" : range}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {widget.range === "custom" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>From</FieldLabel>
                <Input
                  type="datetime-local"
                  value={toLocalInputValue(widget.from)}
                  onChange={(e) => setWidget({ ...widget, from: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                />
              </Field>
              <Field>
                <FieldLabel>To</FieldLabel>
                <Input
                  type="datetime-local"
                  value={toLocalInputValue(widget.to)}
                  onChange={(e) => setWidget({ ...widget, to: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                />
              </Field>
            </div>
          ) : null}

          {widget.kind === "metric-series" ? (
            <>
              <Field>
                <FieldLabel>Chart type</FieldLabel>
                <Select value={widget.chartType} onValueChange={(value) => value && setWidget({ ...widget, chartType: value as (typeof CHART_TYPES)[number] })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={widget.compare ?? false}
                  onCheckedChange={(checked) => setWidget({ ...widget, compare: checked === true })}
                />
                Compare to previous period
              </label>
            </>
          ) : null}

          <FilterFields filters={widget.filters} onChange={setFilters} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(widget);
              onOpenChange(false);
            }}
            disabled={!widget.title.trim()}
          >
            Save widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
