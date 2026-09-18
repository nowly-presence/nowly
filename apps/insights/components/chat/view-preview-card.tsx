"use client";

import { WidgetRenderer } from "@/components/views/widget-renderer";
import { apiFetch } from "@/lib/api-client";
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, toast } from "@nowly/ui";
import type { WidgetConfig } from "@nowly/analytics";
import { useState } from "react";

type GenerateViewOutput = { title: string; widget: Omit<WidgetConfig, "id" | "title"> };

export const ViewPreviewCard = ({ output }: { output: GenerateViewOutput }) => {
  const [saving, setSaving] = useState(false);

  const widget: WidgetConfig = { ...output.widget, id: crypto.randomUUID(), title: output.title } as WidgetConfig;

  const saveAsView = async () => {
    const name = window.prompt("Name this view", output.title);
    if (!name) return;

    setSaving(true);
    try {
      await apiFetch("/insights/views", { method: "POST", body: JSON.stringify({ name, widgets: [widget] }) });
      toast.success(`Saved "${name}"`);
    } catch {
      toast.error("Could not save the view");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">{output.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <WidgetRenderer widget={widget} />
      </CardContent>
      <CardFooter>
        <Button size="sm" onClick={saveAsView} disabled={saving}>
          {saving ? "Saving..." : "Save as view"}
        </Button>
      </CardFooter>
    </Card>
  );
};
