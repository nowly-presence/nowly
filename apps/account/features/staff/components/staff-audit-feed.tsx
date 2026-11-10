"use client";

import type { AuditEvent } from "@/features/staff/lib/staff-api";
import { isRecord } from "@/lib/api-client";
import { useFormatter, useTranslations } from "next-intl";

const detailOf = (details: unknown): string => {
  if (!isRecord(details)) return "";

  const { from, to, name, verified } = details;

  if (typeof from === "string" && typeof to === "string") return `${from} > ${to}`;
  if (typeof name === "string") return name;
  if (typeof verified === "boolean") return String(verified);

  return "";
};

export const StaffAuditRows = ({ events, failed }: {
  events: AuditEvent[] | null;
  failed: boolean;
}) => {
  const t = useTranslations("staff");
  const format = useFormatter();

  const label = (action: string): string => {
    const key = `audit-${action.replaceAll(".", "-")}`;

    return t.has(key) ? t(key) : action;
  };

  if (failed) return (
    <p className="p-4 text-sm text-destructive">
      {t("error")}
    </p>
  );
  if (!events) return (
    <p className="p-4 text-sm text-muted-foreground">
      {t("loading")}
    </p>
  );
  if (events.length === 0) return (
    <p className="p-4 text-sm text-muted-foreground">
      {t("audit-empty")}
    </p>
  );

  return events.map((event) => (
    <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
      <div className="min-w-0">
        <p className="truncate text-foreground">
          <span className="font-medium">{event.actorName ?? t(`audit-actor-${event.actorKind === "user" ? "unknown" : event.actorKind}`)}</span>{" "}
          {label(event.action)}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[
            event.targetType,
            event.targetId,
            detailOf(event.details)
          ]
            .filter(Boolean)
            .join(", ")}
        </p>
      </div>
      <span className="text-xs text-muted-foreground">
        {format.dateTime(new Date(event.createdAt), {
          dateStyle: "medium",
          timeStyle: "short"
        })}
      </span>
    </div>
  ));
};