"use client";

import { useSessionUser } from "@/features/account/components/session-provider";
import { VerifiedBadge } from "@/features/account/components/verified-badge";
import { searchAdminUsers, setAdminUserVerified, type AdminUser } from "@/features/account/lib/account-api";
import { Frame } from "@/features/shell/components/frame";
import { StaffAuditRows } from "@/features/staff/components/staff-audit-feed";
import { PageHeader } from "@/features/shell/components/page-header";
import { useAuditEvents } from "@/features/staff/lib/use-audit-events";
import { fetchStaffUsers, setAdminUserRole } from "@/features/staff/lib/staff-api";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Input } from "@nowly/ui";
import { RiCheckLine, RiSubtractLine } from "@nowly/ui/icons";
import { ADMIN_CAPABILITIES, isUserRole, ROLE_CAPABILITIES, USER_ROLES, type UserRole } from "@nowly/shared/roles";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, type FormEvent } from "react";

const MIN_QUERY_LENGTH = 2;
const RECENT_LIMIT = 5;
const RECENT_ACTIONS = ["user.role.update", "user.verified.update"];

const roleOf = (value: string): UserRole => (isUserRole(value) ? value : "user");

export const StaffUsers = () => {
  const t = useTranslations("staff");
  const self = useSessionUser();
  const [staff, setStaff] = useState<AdminUser[] | null>(null);
  const [found, setFound] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const loadStaff = useCallback((): void => {
    fetchStaffUsers()
      .then(setStaff)
      .catch(() => setFailed(true));
  }, []);

  useEffect(loadStaff, [loadStaff]);

  const onSearch = (event: FormEvent): void => {
    event.preventDefault();

    if (query.trim().length < MIN_QUERY_LENGTH) return;

    setBusy(true);
    setFailed(false);
    searchAdminUsers(query.trim())
      .then(setFound)
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  const run = (action: Promise<void>, apply: () => void): void => {
    setBusy(true);
    setFailed(false);
    action
      .then(() => {
        apply();
        setRefresh((value) => value + 1);
      })
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  const onRole = (target: AdminUser, role: UserRole): void =>
    run(setAdminUserRole(target.id, role), () => {
      setFound((current) => current.map((entry) => (entry.id === target.id ? { ...entry, role } : entry)));
      loadStaff();
    });

  const onVerified = (target: AdminUser): void =>
    run(setAdminUserVerified(target.id, !target.verified), () => {
      const toggle = (entry: AdminUser): AdminUser => (entry.id === target.id ? { ...entry, verified: !target.verified } : entry);
      setFound((current) => current.map(toggle));
      setStaff((current) => (current ? current.map(toggle) : current));
    });

  const rows = [...(staff ?? []), ...found.filter((entry) => !(staff ?? []).some((member) => member.id === entry.id))];

  return (
    <>
      <PageHeader title={t("users-title")} description={t("users-description")} />
      <Frame
        padded={false}
        title={t("users-staff-title")}
        description={t("users-staff-description")}
        action={
          <form onSubmit={onSearch} className="flex gap-2">
            <Input
              className="h-8 w-72"
              value={query}
              placeholder={t("users-search-placeholder")}
              aria-label={t("users-search-placeholder")}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button type="submit" size="sm" disabled={busy || query.trim().length < MIN_QUERY_LENGTH}>
              {t("users-search")}
            </Button>
          </form>
        }
      >
        {failed ? <p className="p-4 text-sm text-destructive">{t("error")}</p> : null}
        {!staff && !failed ? <p className="p-4 text-sm text-muted-foreground">{t("loading")}</p> : null}
        {staff ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-170 text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pl-4 pr-4 font-medium">{t("users-col-user")}</th>
                  <th className="py-2 pl-4 pr-4 font-medium">{t("users-col-role")}</th>
                  {ADMIN_CAPABILITIES.map((capability) => (
                    <th key={capability} className="px-2 py-2 text-center font-medium">
                      {t(`cap-${capability}`)}
                    </th>
                  ))}
                  <th className="py-2 pl-4 pr-4 text-right font-medium">{t("users-col-actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((entry) => {
                  const role = roleOf(entry.role);
                  const own = entry.id === self.id;
                  return (
                    <tr key={entry.id}>
                      <td className="py-2.5 pl-4 pr-4">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar>
                            {entry.image ? <AvatarImage src={entry.image} alt="" /> : null}
                            <AvatarFallback>{entry.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate font-medium text-foreground">
                              {entry.name}
                              {entry.verified || role !== "user" ? <VerifiedBadge /> : null}
                            </p>
                            {entry.username ? <p className="truncate text-xs text-muted-foreground">@{entry.username}</p> : null}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={role === "admin" ? "default" : "secondary"}>{t(`role-${role}`)}</Badge>
                      </td>
                      {ADMIN_CAPABILITIES.map((capability) => (
                        <td key={capability} className="px-2 py-2.5 text-center">
                          {ROLE_CAPABILITIES[role].includes(capability) ? (
                            <RiCheckLine className="mx-auto size-4 text-foreground" aria-label={t("cap-yes")} />
                          ) : (
                            <RiSubtractLine className="mx-auto size-4 text-muted-foreground" aria-label={t("cap-no")} />
                          )}
                        </td>
                      ))}
                      <td className="py-2.5 pl-4 pr-4">
                        <div className="flex justify-end gap-1">
                          {USER_ROLES.map((value) => (
                            <Button
                              key={value}
                              size="sm"
                              variant={value === role ? "secondary" : "ghost"}
                              disabled={busy || own || value === role}
                              onClick={() => onRole(entry, value)}
                            >
                              {t(`role-${value}`)}
                            </Button>
                          ))}
                          {role === "user" ? (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => onVerified(entry)}>
                              {entry.verified ? t("users-unverify") : t("users-verify")}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </Frame>
      <RecentChanges key={refresh} />
    </>
  );
};

const RecentChanges = () => {
  const t = useTranslations("staff");
  const { events, failed } = useAuditEvents();
  const recent = events ? events.filter((event) => RECENT_ACTIONS.includes(event.action)).slice(0, RECENT_LIMIT) : null;
  return (
    <Frame className="mt-6" padded={false} title={t("users-recent")} description={t("users-recent-description")}>
      <StaffAuditRows events={recent} failed={failed} />
    </Frame>
  );
};