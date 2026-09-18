"use client";

import { WidgetRenderer } from "@/components/views/widget-renderer";
import { apiFetch } from "@/lib/api-client";
import { Button, toast } from "@nowly/ui";
import type { ViewConfig } from "@nowly/analytics";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const ViewPage = ({ view, canDuplicate = false }: { view: ViewConfig; canDuplicate?: boolean }) => {
  const router = useRouter();
  const [duplicating, setDuplicating] = useState(false);

  const duplicate = async () => {
    setDuplicating(true);
    try {
      const created = await apiFetch<{ id: string }>("/insights/views", {
        method: "POST",
        body: JSON.stringify({ name: `${view.name} (copy)`, widgets: view.widgets }),
      });
      router.push(`/views/custom/${created.id}/edit`);
    } catch {
      toast.error("Could not duplicate the view");
      setDuplicating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="min-w-0 truncate text-lg font-semibold text-foreground">{view.name}</h1>
        {canDuplicate ? (
          <Button variant="outline" size="sm" className="shrink-0" onClick={duplicate} disabled={duplicating}>
            {duplicating ? "Duplicating..." : "Duplicate"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {view.widgets.map((widget) => (
          <WidgetRenderer key={widget.id} widget={widget} />
        ))}
      </div>
    </div>
  );
};
