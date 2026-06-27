"use client";

import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/constants";
import { IconCheck, IconDownload, IconLoader2, IconAlertTriangle } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useCallback, useState, type FC } from "react";

type Props = {
  deviceId: string;
  token: string;
};

type Status = "idle" | "loading" | "done" | "error";

export const ExportCard: FC<Props> = ({ deviceId, token }) => {
  const t = useTranslations("consent-page");
  const [status, setStatus] = useState<Status>("idle");

  const handleExport = useCallback(() => {
    setStatus("loading");
    fetch(`${API_BASE_URL}/analytics/device/${encodeURIComponent(deviceId)}/export`, {
      cache: "no-store",
      headers: token ? { "X-Device-Token": token } : undefined,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Export failed");
        return res.json();
      })
      .then((data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nowly-data-${deviceId.slice(0, 8)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, [deviceId, token]);

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {t("export-title")}
      </h2>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {t("export-description")}
      </p>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={status === "loading"}>
          {status === "loading" ? (
            <IconLoader2 className="h-4 w-4 animate-spin" />
          ) : (
            <IconDownload className="h-4 w-4" />
          )}
          {status === "loading" ? t("loading") : t("export-button")}
        </Button>
        {status === "done" && (
          <span className="flex items-center gap-1 text-xs text-emerald-500">
            <IconCheck className="h-3 w-3" />
            {t("export-success")}
          </span>
        )}
        {status === "error" && (
          <span className="flex items-center gap-1 text-xs text-warning">
            <IconAlertTriangle className="h-3 w-3" />
            {t("export-error")}
          </span>
        )}
      </div>
    </section>
  );
};
