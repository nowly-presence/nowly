"use client";

import { fetchAuditEvents, type AuditEvent } from "@/features/staff/lib/staff-api";
import { Button, Card, CardContent } from "@nowly/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const detailOf = (details: unknown): string => {
  if (!isRecord(details)) return "";

  const { from, to, name, verified } = details;

  if (typeof from === "string" && typeof to === "string") return `${from} > ${to}`;
  if (typeof name === "string") return name;
  if (typeof verified === "boolean") return String(verified);

  return "";
};

export const StaffAuditFeed = ({ actions, limit, paged = false }: {
  actions?: readonly string[];
  limit?: number;
  paged?: boolean;
}) => {
  const t = useTranslations("staff");
  const format = useFormatter();
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchAuditEvents()
      .then((page) => {
        setEvents(page);
        setDone(page.length === 0);
      })
      .catch(() => setFailed(true));
  }, []);

  const onMore = (): void => {
    const last = events?.at(-1);

    if (!last) return;

    setBusy(true);
    fetchAuditEvents(last.createdAt)
      .then((page) => {
        setEvents((current) => [...(current ?? []), ...page]);
        setDone(page.length === 0);
      })
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  const visible = (events ?? []).filter((event) => !actions || actions.includes(event.action)).slice(0, limit);
  const label = (action: string): string => {
    const key = `audit-${action.replaceAll(".", "-")}`;

    return t.has(key) ? t(key) : action;
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        {failed ? <p className="text-sm text-destructive">{t("error")}</p> : null}
        {!events && !failed ? <p className="text-sm text-muted-foreground">{t("loading")}</p> : null}
        {events && visible.length === 0 ? <p className="text-sm text-muted-foreground">{t("audit-empty")}</p> : null}
        {visible.length > 0 ? (
          <ul className="divide-y divide-border">
            {visible.map((event) => (
              <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-foreground">
                    <span className="font-medium">{event.actorName ?? t(`audit-actor-${event.actorKind === "user" ? "unknown" : event.actorKind}`)}</span> {label(event.action)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{[event.targetType, event.targetId, detailOf(event.details)].filter(Boolean).join(", ")}</p>
                </div>
                <span className="text-xs text-muted-foreground">{format.dateTime(new Date(event.createdAt), { dateStyle: "medium", timeStyle: "short" })}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {paged && events && !done ? (
          <Button variant="outline" className="self-start" disabled={busy} onClick={onMore}>
            {t("audit-more")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
};
