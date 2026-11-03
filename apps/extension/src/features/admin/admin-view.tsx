import { RiAddLine, RiRefreshLine, RiShieldCheckLine } from "@remixicon/react";
import { BackHeader, ScreenBody } from "@/components/shared/screen";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { formatDateTime } from "@/lib/format";
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
        {staff.ready && !staff.access?.granted && (
          <EmptyState
            icon={<RiShieldCheckLine className="size-5" />}
            title={t("admin.allowTitle")}
            description={t("admin.allowHint")}
            action={
              <Button loading={staff.connecting} onClick={() => void staff.connect()}>
                {t("admin.allow")}
              </Button>
            }
          />
        )}

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
      </ScreenBody>
    </div>
  );
};