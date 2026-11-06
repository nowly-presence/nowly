import { useEffect, useRef } from "react";
import { ChatAvatar } from "@/components/shared/chat/chat-avatar";
import { ChatMarker } from "@/components/shared/chat/chat-marker";
import { ChatMessage } from "@/components/shared/chat/chat-message";
import { ChatNote } from "@/components/shared/chat/chat-note";
import { ChatQuestionnaire } from "@/components/shared/chat/chat-questionnaire";
import { useI18n } from "@/hooks/i18n-provider";
import { REPORT_MESSAGE_MAX_LENGTH, type ReportMessage } from "@/shared/reports";
import { RiLockLine } from "@remixicon/react";
import { Badge } from "@/ui/badge";
import { REPORT_STATUS_LABELS } from "@/components/shared/report-status-badge";

type ReportThreadViewProps = {
  messages: ReportMessage[];
  audience?: "reporter" | "staff";
  selfName?: string;
  answering?: boolean;
  closed?: boolean;
  onAnswer?: (answer: string, answerTo: string) => void;
  onNote?: (message: ReportMessage) => void;
};

const pendingRequest = (messages: ReportMessage[]): ReportMessage | null => {
  const request = [...messages].reverse().find((message) => message.kind === "info_request");

  if (!request) return null;

  return messages.some((message) => message.answerTo === request.id) ? null : request;
};

const GROUP_WINDOW_MS = 5 * 60_000;

type Previous = {
  key: string;
  at: number;
};

export const ReportThreadView = ({ messages, audience = "reporter", selfName, answering = false, closed = false, onAnswer, onNote }: ReportThreadViewProps) => {
  const { t } = useI18n();
  const endRef = useRef<HTMLDivElement>(null);
  const request = closed || audience === "staff" ? null : pendingRequest(messages);
  const targets = new Set(messages.filter((message) => message.kind !== "note").map((message) => message.id));
  const notes = new Map<string, ReportMessage[]>();
  let previous: Previous | null = null;

  for (const message of messages) {
    if (message.kind !== "note" || !message.answerTo || !targets.has(message.answerTo)) continue;

    notes.set(message.answerTo, [...(notes.get(message.answerTo) ?? []), message]);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex flex-col gap-4" role="log" aria-live="polite">
      {messages.map((message) => {
        if (message.kind === "status_change" && message.statusTo) {
          previous = null;

          return (
            <ChatMarker key={message.id}>
              {t("report.statusChanged", { status: t(REPORT_STATUS_LABELS[message.statusTo]) })}
            </ChatMarker>
          );
        }

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

        if (message.kind === "note") {
          if (message.answerTo && targets.has(message.answerTo)) return null;

          previous = null;

          return (
            <div key={message.id} className="self-start">
              <ChatNote label={t("report.staff.noteBadge")} author={name} body={message.body} />
            </div>
          );
        }

        const at = Date.parse(message.createdAt);
        const key = `${message.authorRole}:${message.authorName ?? ""}`;
        const continued = previous !== null && previous.key === key && at - previous.at <= GROUP_WINDOW_MS && at >= previous.at;
        previous = { key, at };
        const attached = notes.get(message.id) ?? [];

        return (
          <ChatMessage
            key={message.id}
            own={own}
            name={name}
            continued={continued}
            indent={staff || !reporterView}
            images={message.attachments}
            avatar={!own && (staff || !reporterView) ? <ChatAvatar name={name} src={message.authorAvatar} /> : undefined}
            meta={staff && role ? <Badge tone="primary">{role}</Badge> : undefined}
            reactions={
              attached.length > 0
                ? attached.map((note) => (
                    <ChatNote key={note.id} label={t("report.staff.noteBadge")} author={note.authorName ?? t("report.team")} body={note.body} />
                  ))
                : undefined
            }
            actions={
              onNote && audience === "staff" ? (
                <button
                  type="button"
                  onClick={() => onNote(message)}
                  className="flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-0.5 text-label-sm text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-ink focus-visible:opacity-100"
                >
                  <RiLockLine className="size-3" />
                  {t("report.staff.addNote")}
                </button>
              ) : undefined
            }
          >
            {message.body}
          </ChatMessage>
        );
      })}
      {request?.choices && (
        <div className="pl-[38px]">
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
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
};