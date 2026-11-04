import { useState } from "react";
import { RiAddLine, RiDeleteBinLine, RiEyeLine, RiRefreshLine } from "@remixicon/react";
import { PresenceDeleteSheet } from "@/components/shared/presence-delete-sheet";
import { BackHeader, ScreenBody } from "@/components/shared/screen";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { useHiddenPresences } from "@/hooks/use-hidden-presences";
import { usePresenceModeration } from "@/hooks/use-presence-moderation";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { formatDateTime } from "@/lib/format";
import type { HiddenPresence } from "@/shared/admin/admin-types";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { DotSeparator } from "@/ui/dot-separator";
import { EmptyState } from "@/ui/empty-state";
import { Row } from "@/ui/row";
import { Section } from "@/ui/section";
import { Skeleton } from "@/ui/skeleton";
import { SUBMISSION_TONES, submissionStatusKey } from "@/lib/submission-status";
import { adminErrorKey } from "@/lib/admin-error";
import { useReviewQueue } from "@/features/admin/use-review-queue";

export const AdminView = () => {
  const { t, locale } = useI18n();
  const { pop, push } = useNav();
  const staff = useStaffAccess();
  const reviewing = staff.can("review");
  const { items, error, loading, reload } = useReviewQueue(reviewing);
  const publishing = staff.can("publish");
  const hidden = useHiddenPresences(publishing);
  const moderation = usePresenceModeration(() => void hidden.reload());
  const [deleting, setDeleting] = useState<HiddenPresence | null>(null);

  return (
    <div className="flex min-h-full flex-col">
      <BackHeader
        title={t("admin.title")}
        onBack={pop}
        backLabel={t("action.back")}
        action={
          reviewing && (
            <Button size="sm" variant="ghost" icon={<RiRefreshLine className="size-4" />} loading={loading} onClick={() => void reload()}>
              {t("admin.refresh")}
            </Button>
          )
        }
      />
      <ScreenBody className="pt-0">
        {staff.can("announce") && (
          <Button variant="secondary" icon={<RiAddLine className="size-4" />} onClick={() => push({ name: "admin-announcement" })}>
            {t("admin.newAnnouncement")}
          </Button>
        )}

        {reviewing && (
          <Section title={t("admin.queue")}>
            {error && <p className="px-1 text-label-md text-danger">{t(adminErrorKey(error))}</p>}
            {!items && !error && <Skeleton className="h-16" />}
            {items && items.length === 0 && <EmptyState title={t("admin.queueEmpty")} description={t("admin.queueEmptyHint")} />}
            {items && items.length > 0 && (
              <Group>
                {items.map((item) => (
                  <Row
                    key={item.id}
                    title={item.slug}
                    description={
                      <span className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1.5">
                          {t("admin.by", { name: item.author?.name ?? t("admin.unknownAuthor") })}
                          <DotSeparator />
                          {formatDateTime(item.updatedAt, locale)}
                        </span>
                        <span className="flex flex-wrap gap-1">
                          <Badge tone={SUBMISSION_TONES[item.status]}>{t(submissionStatusKey(item.status))}</Badge>
                          <Badge tone="outline">{t(item.kind === "update" ? "admin.kindUpdate" : "admin.kindCreate")}</Badge>
                        </span>
                      </span>
                    }
                    align="start"
                    chevron
                    onClick={() =>
                      push({
                        name: "admin-review",
                        id: item.id
                      })
                    }
                  />
                ))}
              </Group>
            )}
          </Section>
        )}

        {publishing && hidden.items && hidden.items.length > 0 && (
          <Section title={t("admin.presence.hiddenTitle")}>
            <Group>
              {hidden.items.map((item) => (
                <Row
                  key={item.slug}
                  title={item.name}
                  description={item.slug}
                  trailing={
                    <span className="flex items-center gap-1.5">
                      <Button size="sm" variant="secondary" icon={<RiEyeLine className="size-4" />} loading={moderation.busy === "show"} onClick={() => void moderation.show(item.slug)}>
                        {t("admin.presence.showAction")}
                      </Button>
                      <Button size="icon-sm" variant="ghost" className="hover:text-danger" aria-label={t("admin.presence.delete")} onClick={() => setDeleting(item)}>
                        <RiDeleteBinLine className="size-4" />
                      </Button>
                    </span>
                  }
                />
              ))}
            </Group>
          </Section>
        )}
      </ScreenBody>
      <PresenceDeleteSheet
        name={deleting?.name ?? ""}
        open={deleting !== null}
        pending={moderation.busy === "delete"}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void moderation.remove(deleting.slug).then(() => setDeleting(null));
        }}
      />
    </div>
  );
};