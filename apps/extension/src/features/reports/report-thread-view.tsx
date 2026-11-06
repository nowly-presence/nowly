import { useEffect, useRef } from "react";
import { ChatAvatar } from "@/components/shared/chat/chat-avatar";
import { ChatMarker } from "@/components/shared/chat/chat-marker";
import { ChatMessage } from "@/components/shared/chat/chat-message";
import { ChatQuestionnaire } from "@/components/shared/chat/chat-questionnaire";
import { useI18n } from "@/hooks/i18n-provider";
import { REPORT_MESSAGE_MAX_LENGTH, type ReportMessage } from "@/shared/reports";
import { Badge } from "@/ui/badge";
import { REPORT_STATUS_LABELS } from "@/components/shared/report-status-badge";

type ReportThreadViewProps = {
  messages: ReportMessage[];
  audience?: "reporter" | "staff";
  selfName?: string;
  answering?: boolean;
  closed?: boolean;
  onAnswer?: (answer: string, answerTo: string) => void;
};

const pendingRequest = (messages: ReportMessage[]): ReportMessage | null => {
  const request = [...messages].reverse().find((message) => message.kind === "info_request");

  if (!request) return null;

  return messages.some((message) => message.answerTo === request.id) ? null : request;
};

export const ReportThreadView = ({ messages, audience = "reporter", selfName, answering = false, closed = false, onAnswer }: ReportThreadViewProps) => {
  const { t } = useI18n();
  const endRef = useRef<HTMLDivElement>(null);
  const request = closed || audience === "staff" ? null : pendingRequest(messages);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex flex-col gap-4" role="log" aria-live="polite">
      {messages.map((message) => {
        if (message.kind === "status_change" && message.statusTo) return (
          <ChatMarker key={message.id}>
            {t("report.statusChanged", { status: t(REPORT_STATUS_LABELS[message.statusTo]) })}
          </ChatMarker>
        );

        if (message.authorRole === "system") return null;

        const staff = message.authorRole === "staff";
        const reporterView = audience === "reporter";
        const own = reporterView ? !staff : staff && message.authorName === selfName;
        const name =
          own && !reporterView
            ? t("report.you")
            : staff
              ? (message.authorName ?? t("report.team"))
              : reporterView
                ? t("report.you")
                : (message.authorName ?? t("report.anonymous"));
        const role = message.authorStaffRole === "admin" ? t("report.role.admin") : message.authorStaffRole === "moderator" ? t("report.role.moderator") : null;

        return (
          <ChatMessage
            key={message.id}
            own={own}
            name={name}
            tone={message.kind === "note" ? "note" : "default"}
            images={message.attachments}
            avatar={!own && (staff || !reporterView) ? <ChatAvatar name={name} src={message.authorAvatar} /> : undefined}
            meta={
              message.kind === "note" ? (
                <Badge tone="outline">{t("report.staff.noteBadge")}</Badge>
              ) : staff && role ? (
                <Badge tone="primary">{role}</Badge>
              ) : undefined
            }
          >
            {message.body}
          </ChatMessage>
        );
      })}
      {request?.choices && (
        <ChatQuestionnaire
          title={t("report.infoRequest")}
          question={request.body}
          choices={request.choices}
          otherLabel={t("report.otherAnswer")}
          submitLabel={t("report.answer")}
          placeholder={t("report.replyPlaceholder")}
          maxLength={REPORT_MESSAGE_MAX_LENGTH}
          busy={answering}
          onSubmit={(answer) => onAnswer?.(answer, request.id)}
        />
      )}
      <div ref={endRef} />
    </div>
  );
};