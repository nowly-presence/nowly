"use client";

import { apiFetch } from "@/lib/api-client";
import { Button, toast } from "@nowly/ui";
import { RiUploadCloud2Line } from "@nowly/ui/icons";
import { useRef, useState } from "react";

type ImportResult = { cleared: number; inserted: number; skipped: string[] };

export const CwsStatsImport = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setLoading(true);
    try {
      const files = await Promise.all(
        Array.from(fileList).map(async (file) => ({ name: file.name, content: await file.text() })),
      );
      const result = await apiFetch<ImportResult>("/insights/cws-stats/import", {
        method: "POST",
        body: JSON.stringify({ files }),
      });
      toast.success(
        `Imported ${result.inserted} rows (cleared ${result.cleared} old)`
        + (result.skipped.length ? ` - skipped: ${result.skipped.join(", ")}` : ""),
      );
    } catch {
      toast.error("Could not import CWS stats");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-dashed border-sidebar-border p-2">
      <span className="px-1 text-[0.65rem] font-medium uppercase tracking-wide text-sidebar-foreground/50">CWS stats</span>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={(event) => void onFiles(event.target.files)}
      />
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={loading}>
        <RiUploadCloud2Line data-icon="inline-start" />
        {loading ? "Importing..." : "Upload CWS CSVs"}
      </Button>
    </div>
  );
};
