import { useState } from "react";
import { BackHeader, ScreenBody } from "@/components/shared/screen";
import { ReviewThread } from "@/components/shared/review-thread";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { useSubmissionDetail } from "@/hooks/use-submission-detail";
import { Section } from "@/ui/section";
import { Skeleton } from "@/ui/skeleton";
import { adminErrorKey } from "@/lib/admin-error";
import { AdminPublishPanel } from "@/features/admin/admin-publish-panel";
import { AdminReviewForm, type CommentTarget } from "@/features/admin/admin-review-form";
import { AdminSubmissionSummary } from "@/features/admin/admin-submission-summary";

export const AdminReviewView = ({ id }: {
  id: string;
}) => {
  const { t } = useI18n();
  const { pop } = useNav();
  const staff = useStaffAccess();
  const { detail, error, loading, reload } = useSubmissionDetail(id);
  const [target, setTarget] = useState<CommentTarget | null>(null);

  return (
    <div className="flex min-h-full flex-col">
      <BackHeader title={detail?.definition?.name ?? t("admin.review.title")} onBack={pop} backLabel={t("action.back")} />
      <ScreenBody className="pt-0">
        {loading && <Skeleton className="h-40" />}
        {error && <p className="px-1 text-label-md text-danger">{t(adminErrorKey(error))}</p>}
        {detail && (
          <>
            <AdminSubmissionSummary
              detail={detail}
              onComment={(field, page) =>
                setTarget({
                  field,
                  page,
                  nonce: Date.now()
                })
              }
            />
            <Section title={t("submissionReview.thread")}>
              <ReviewThread reviews={detail.reviews} />
            </Section>
            {staff.can("review") && <AdminReviewForm detail={detail} target={target} onDone={() => void reload()} />}
            {staff.can("publish") && <AdminPublishPanel detail={detail} onDone={() => void reload()} />}
          </>
        )}
      </ScreenBody>
    </div>
  );
};