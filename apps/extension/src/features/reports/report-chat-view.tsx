import { BackHeader, ScreenBody } from "@/components/shared/screen";
import { ChatPromptInput } from "@/components/shared/chat/chat-prompt-input";
import { PresenceIcon } from "@/components/shared/presence-icon";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { REPORT_MESSAGE_MAX_LENGTH } from "@/shared/reports";
import { readableName } from "@/lib/readable-name";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";
import { useToast } from "@/ui/toast";
import { ReportStatusBadge } from "@/components/shared/report-status-badge";
import { ReportThreadView } from "@/features/reports/report-thread-view";
import { useReportThread } from "@/features/reports/use-report-thread";

const ICON_SIZE = 28;

export const ReportChatView = ({ id }: {
  id: string;
}) => {
  const { t } = useI18n();
  const { pop } = useNav();
  const { toast } = useToast();
  const { report, messages, error, busy, reply, setClosed } = useReportThread(id);
  const name = report ? readableName(report.slug) : "";
  const closed = report?.status === "closed";

  const send = async (message: string, answerTo?: string, attachments?: string[]): Promise<boolean> => {
    const sent = await reply(message, answerTo, attachments);

    if (!sent) toast(t("report.sendError"), "error");

    return sent;
  };

  return (
    <div className="flex min-h-full flex-col">
      <BackHeader
        title={report ? t("report.chatTitle", { name }) : undefined}
        onBack={pop}
        backLabel={t("action.back")}
        action={report && <ReportStatusBadge status={report.status} />}
      />
      <ScreenBody className="flex-1 pt-2 pb-4!">
        {!report && !error && <Skeleton className="h-40" />}
        {error && !report && <p className="px-1 text-label-md text-danger">{t("report.loadError")}</p>}
        {report && (
          <>
            <div className="flex items-center gap-2 px-1 text-label-md text-muted">
              <PresenceIcon slug={report.slug} name={name} size={ICON_SIZE} />
              <span>{t("report.chatIntro")}</span>
            </div>
            <ReportThreadView messages={messages} answering={busy} closed={closed} onAnswer={(answer, answerTo) => void send(answer, answerTo)} />
            {closed ? (
              <div className="flex flex-col gap-3 rounded-md bg-hover p-3 text-label-md text-muted">
                <span>{t("report.closedNotice")}</span>
                <Button variant="secondary" loading={busy} onClick={() => void setClosed(false)}>
                  {t("report.reopen")}
                </Button>
              </div>
            ) : (
              <div className="sticky bottom-0 mt-auto flex flex-col gap-2 bg-canvas pt-2">
                <ChatPromptInput
                  placeholder={t("report.replyPlaceholder")}
                  sendLabel={t("report.sendMessage")}
                  attachLabel={t("report.attach")}
                  removeLabel={t("report.attachRemove")}
                  onAttachError={() => toast(t("report.attachHint"), "error")}
                  maxLength={REPORT_MESSAGE_MAX_LENGTH}
                  busy={busy}
                  onSend={(message, attachments) => send(message, undefined, attachments)}
                />
                <Button variant="link" className="self-center" disabled={busy} onClick={() => void setClosed(true)}>
                  {t("report.close")}
                </Button>
              </div>
            )}
          </>
        )}
      </ScreenBody>
    </div>
  );
};