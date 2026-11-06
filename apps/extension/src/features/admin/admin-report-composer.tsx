import { useState } from "react";
import { RiCloseLine, RiLockLine } from "@remixicon/react";
import { ChatPromptInput } from "@/components/shared/chat/chat-prompt-input";
import { REPORT_STATUS_LABELS } from "@/components/shared/report-status-badge";
import { useI18n } from "@/hooks/i18n-provider";
import { REPORT_MESSAGE_MAX_LENGTH, REPORT_STATUSES, type ReportMessage, type ReportStatus } from "@/shared/reports";
import { Select } from "@/ui/select";
import { useToast } from "@/ui/toast";
import { AdminReportAskSheet } from "@/features/admin/admin-report-ask-sheet";
import type { StaffSend } from "@/features/admin/use-admin-report-thread";

type AdminReportComposerProps = {
  status: ReportStatus;
  reporterLabel: string;
  busy: boolean;
  noteTarget: ReportMessage | null;
  onClearNote: () => void;
  onSend: (input: StaffSend) => Promise<boolean>;
};

const ASK_ACTION = "ask";
const EXCERPT_MAX = 60;

const excerpt = (body: string): string => (body.length > EXCERPT_MAX ? `${body.slice(0, EXCERPT_MAX)}...` : body);

export const AdminReportComposer = ({ status, reporterLabel, busy, noteTarget, onClearNote, onSend }: AdminReportComposerProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [target, setTarget] = useState<ReportStatus>(status);
  const [asking, setAsking] = useState(false);
  const noting = noteTarget !== null;
  const statusChanged = !noting && target !== status;

  const send = async (message: string, attachments: string[]): Promise<boolean> => {
    const sent = await onSend(
      noteTarget
        ? { message, visibility: "internal", noteOn: noteTarget.id }
        : { message, visibility: "public", ...(attachments.length > 0 ? { attachments } : {}), ...(statusChanged ? { statusTo: target } : {}) }
    );

    if (sent) onClearNote();

    return sent;
  };

  return (
    <>
      {noteTarget && (
        <div className="flex items-center gap-2 rounded-md border border-line-strong px-3 py-2 text-label-sm text-muted">
          <RiLockLine className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{t("report.staff.noteOn", { text: excerpt(noteTarget.body) })}</span>
          <button type="button" aria-label={t("action.cancel")} onClick={onClearNote} className="shrink-0 text-muted hover:text-ink">
            <RiCloseLine className="size-4" />
          </button>
        </div>
      )}
      <ChatPromptInput
        key={noteTarget?.id ?? "message"}
        placeholder={
          noting
            ? t("report.staff.noteHint")
            : t("report.staff.replyPlaceholder", { name: reporterLabel })
        }
        sendLabel={t("report.sendMessage")}
        attachLabel={t("report.attach")}
        removeLabel={t("report.attachRemove")}
        onAttachError={() => toast(t("report.attachHint"), "error")}
        maxLength={REPORT_MESSAGE_MAX_LENGTH}
        busy={busy}
        allowEmpty={statusChanged}
        attachable={!noting}
        onSend={send}
        extraActions={
          noting
            ? []
            : [
                {
                  value: ASK_ACTION,
                  label: t("report.staff.askInfo")
                }
              ]
        }
        onExtraAction={() => setAsking(true)}
        tools={
          noting ? undefined : (
            <Select
              aria-label={t("report.staff.statusLabel")}
              value={target}
              className="w-44!"
              onChange={(value) => setTarget(REPORT_STATUSES.find((entry) => entry === value) ?? status)}
              options={REPORT_STATUSES.map((entry) => ({
                value: entry,
                label: t(REPORT_STATUS_LABELS[entry])
              }))}
            />
          )
        }
      />
      <AdminReportAskSheet
        open={asking}
        busy={busy}
        onClose={() => setAsking(false)}
        onSend={(question, choices) =>
          onSend({
            message: question,
            visibility: "public",
            choices
          })
        }
      />
    </>
  );
};