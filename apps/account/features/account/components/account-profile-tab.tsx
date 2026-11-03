"use client";

import { VerifiedBadge } from "@/features/account/components/verified-badge";
import type { AccountUser } from "@/features/account/lib/account-api";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, CardDescription, CardTitle, Separator } from "@nowly/ui";
import { RiDeleteBinLine, RiDownload2Line, RiLogoutBoxRLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";

type Message = "exported" | "error" | null;

export const AccountProfileTab = ({ user, busy, message, onSignOut, onExport, onDelete }: {
  user: AccountUser;
  busy: boolean;
  message: Message;
  onSignOut: () => void;
  onExport: () => void;
  onDelete: () => void;
}) => {
  const t = useTranslations("accountPage");
  const staff = user.capabilities.length > 0;
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Avatar className="size-14 shrink-0">
              {user.image ? <AvatarImage src={user.image} alt="" /> : null}
              <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="flex min-w-0 items-center gap-1.5 text-lg">
                  <span className="truncate">{user.name}</span>
                  {user.verified ? <VerifiedBadge /> : null}
                </CardTitle>
              </div>
              <Button variant="outline" size="sm" className="shrink-0" disabled={busy} onClick={onSignOut}>
                <RiLogoutBoxRLine data-icon="inline-start" />
                {t("sign-out")}
              </Button>
            </div>
            {staff ? (
              <div>
                <Badge variant="secondary">{t(user.role === "admin" ? "role-admin" : "role-moderator")}</Badge>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <CardTitle className="text-lg">{t("data-title")}</CardTitle>
          <CardDescription className="mt-2">{t("data-description")}</CardDescription>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" disabled={busy} onClick={onExport}>
              <RiDownload2Line data-icon="inline-start" />
              {t("export")}
            </Button>
            <Button variant="outline" disabled={busy} onClick={onDelete}>
              <RiDeleteBinLine data-icon="inline-start" />
              {t("delete")}
            </Button>
          </div>
          <Separator className="my-6" />
          <p className="text-xs text-muted-foreground">{t("local-note")}</p>
          {message === "exported" ? <p className="mt-3 text-sm text-muted-foreground">{t("export-success")}</p> : null}
          {message === "error" ? <p className="mt-3 text-sm text-destructive">{t("action-error")}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
};