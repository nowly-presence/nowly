"use client";

import { WidgetEditorDialog } from "@/components/views/widget-editor-dialog";
import { WidgetRenderer } from "@/components/views/widget-renderer";
import { apiFetch } from "@/lib/api-client";
import { Button, Card, CardContent, Field, FieldLabel, Input, toast } from "@nowly/ui";
import { RiAddLine, RiDeleteBinLine } from "@nowly/ui/icons";
import type { ViewConfig, WidgetConfig } from "@nowly/analytics";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const ViewEditor = ({ viewId, initial }: { viewId?: string; initial: ViewConfig }) => {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initial.widgets);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const addWidget = (widget: WidgetConfig) => setWidgets((current) => [...current, widget]);
  const removeWidget = (id: string) => setWidgets((current) => current.filter((w) => w.id !== id));

  const save = async () => {
    if (!name.trim()) {
      toast.error("Give this view a name");
      return;
    }

    setSaving(true);
    try {
      if (viewId) {
        await apiFetch(`/insights/views/${viewId}`, { method: "PATCH", body: JSON.stringify({ name, widgets }) });
      } else {
        const created = await apiFetch<{ id: string }>("/insights/views", { method: "POST", body: JSON.stringify({ name, widgets }) });
        router.push(`/views/custom/${created.id}/edit`);
        return;
      }
      toast.success("View saved");
      router.refresh();
    } catch {
      toast.error("Could not save the view");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Field className="max-w-sm">
          <FieldLabel>View name</FieldLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Number of installs" />
        </Field>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save view"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {widgets.map((widget) => (
          <div key={widget.id} className="relative">
            <WidgetRenderer widget={widget} />
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-2 top-2"
              onClick={() => removeWidget(widget.id)}
              aria-label="Remove widget"
            >
              <RiDeleteBinLine />
            </Button>
          </div>
        ))}

        <Card className="flex min-h-32 items-center justify-center border-dashed">
          <CardContent>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <RiAddLine data-icon="inline-start" />
              Add widget
            </Button>
          </CardContent>
        </Card>
      </div>

      <WidgetEditorDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={addWidget} />
    </div>
  );
};
