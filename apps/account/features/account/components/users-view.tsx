"use client";

import { AccountPageFrame } from "@/features/account/components/account-page-frame";
import { useSessionUser } from "@/features/account/components/session-provider";
import { searchAdminUsers, setAdminUserVerified, type AdminUser } from "@/features/account/lib/account-api";
import { VerifiedBadge } from "@/features/account/components/verified-badge";
import { Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, Input } from "@nowly/ui";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

const MIN_QUERY_LENGTH = 2;
const STAFF_ROLES = ["admin", "moderator"];

export const UsersView = () => {
  const t = useTranslations("accountPage");
  const user = useSessionUser();
  const allowed = user.capabilities.includes("manage");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminUser[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const onSearch = (event: FormEvent): void => {
    event.preventDefault();

    if (query.trim().length < MIN_QUERY_LENGTH) return;

    setBusy(true);
    setFailed(false);
    searchAdminUsers(query.trim())
      .then(setResults)
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  const onToggle = (target: AdminUser): void => {
    setBusy(true);
    setFailed(false);
    setAdminUserVerified(target.id, !target.verified)
      .then(() => setResults((current) => (current ?? []).map((entry) => (entry.id === target.id ? { ...entry, verified: !target.verified } : entry))))
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  return (
    <AccountPageFrame eyebrow={t("eyebrow")} title={t("users-title")} description={t("users-description")}>
      {!allowed ? (
        <p className="text-sm text-destructive">{t("action-error")}</p>
      ) : (
        <div className="flex max-w-xl flex-col gap-4">
          <form onSubmit={onSearch} className="flex gap-2">
            <Input
              value={query}
              placeholder={t("users-search-placeholder")}
              aria-label={t("users-search-placeholder")}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button type="submit" disabled={busy || query.trim().length < MIN_QUERY_LENGTH}>
              {t("users-search")}
            </Button>
          </form>
          {failed ? <p className="text-sm text-destructive">{t("action-error")}</p> : null}
          {results ? (
            <Card>
              <CardContent>
                {results.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("users-empty")}</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {results.map((entry) => {
                      const staff = STAFF_ROLES.includes(entry.role);
                      return (
                        <li key={entry.id} className="flex items-center justify-between gap-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar>
                              {entry.image ? <AvatarImage src={entry.image} alt="" /> : null}
                              <AvatarFallback>{entry.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                                {entry.name}
                                {entry.verified || staff ? <VerifiedBadge /> : null}
                              </p>
                              {entry.username ? <p className="truncate text-xs text-muted-foreground">@{entry.username}</p> : null}
                            </div>
                          </div>
                          {staff ? (
                            <span className="text-xs text-muted-foreground">{t("users-verified-staff")}</span>
                          ) : (
                            <Button variant="outline" size="sm" disabled={busy} onClick={() => onToggle(entry)}>
                              {entry.verified ? t("users-unverify") : t("users-verify")}
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </AccountPageFrame>
  );
};