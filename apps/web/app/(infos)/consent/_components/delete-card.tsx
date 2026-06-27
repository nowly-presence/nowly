"use client";

import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/constants";
import { IconCheck, IconLoader2, IconTrash, IconAlertTriangle } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useCallback, useState, type FC } from "react";

type Props = {
  deviceId: string;
  token: string;
  onDeleted: () => void;
};

type Status = "idle" | "loading" | "confirm" | "done" | "error";

export const DeleteCard: FC<Props> = ({ deviceId, token, onDeleted }) => {
  const t = useTranslations("consent-page");
  const [status, setStatus] = useState<Status>("idle");

  const handleDelete = useCallback(() => {
    setStatus("loading");
    fetch(`${API_BASE_URL}/analytics/device/${encodeURIComponent(deviceId)}`, {
      method: "DELETE",
      cache: "no-store",
      headers: token ? { "X-Device-Token": token } : undefined,
    })
      .then((res) => {
        setStatus(res.ok ? "done" : "error");
        if (res.ok) onDeleted();
      })
      .catch(() => setStatus("error"));
  }, [deviceId, token, onDeleted]);

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {t("delete-title")}
      </h2>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {t("delete-description")}
      </p>

      {status === "confirm" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/20 bg-warning/5 p-4">
          <p className="w-full text-sm font-medium text-foreground">{t("delete-confirm")}</p>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            {t("delete-button")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setStatus("idle")}>
            {t("delete-cancel")}
          </Button>
        </div>
      ) : (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setStatus("confirm")}
          disabled={status === "loading" || status === "done"}
        >
          {status === "loading" ? (
            <IconLoader2 className="h-4 w-4 animate-spin" />
          ) : (
            <IconTrash className="h-4 w-4" />
          )}
          {status === "loading" ? t("loading") : t("delete-button")}
        </Button>
      )}

      {status === "done" && (
        <p className="mt-3 flex items-center gap-1 text-xs text-emerald-500">
          <IconCheck className="h-3 w-3" />
          {t("delete-success")}
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 flex items-center gap-1 text-xs text-warning">
          <IconAlertTriangle className="h-3 w-3" />
          {t("delete-error")}
        </p>
      )}
    </section>
  );
};
