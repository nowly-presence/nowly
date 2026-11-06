import { useState } from "react";
import { ChatPromptInput } from "@/components/shared/chat/chat-prompt-input";
import { REPORT_STATUS_LABELS } from "@/components/shared/report-status-badge";
import { useI18n } from "@/hooks/i18n-provider";
import { REPORT_MESSAGE_MAX_LENGTH, REPORT_STATUSES, type ReportStatus } from "@/shared/reports";
import { Select } from "@/ui/select";
import { useToast } from "@/ui/toast";
import { AdminReportAskSheet } from "@/features/admin/admin-report-ask-sheet";
import type { StaffSend } from "@/features/admin/use-admin-report-thread";

type AdminReportComposerProps = {
  status: ReportStatus;
  reporterLabel: string;
  busy: boolean;
  onSend: (input: StaffSend) => Promise<boolean>;
};

const ASK_ACTION = "ask";

export const AdminReportComposer = ({ status, reporterLabel, busy, onSend }: AdminReportComposerProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [target, setTarget] = useState<ReportStatus>(status);
  const [visibility, setVisibility] = useState<"public" | "internal">("public");
  const [asking, setAsking] = useState(false);
  const internal = visibility === "internal";
  const statusChanged = !internal && target !== status;

  const send = async (message: string, attachments: string[]): Promise<boolean> => {
    const sent = await onSend({ message, visibility, ...(attachments.length > 0 ? { attachments } : {}), ...(statusChanged ? { statusTo: target } : {}) });

    if (sent) setVisibility("public");

    return sent;
  };

  return (
    <>
      <ChatPromptInput
        placeholder={internal ? t("report.staff.noteHint") : t("report.staff.replyPlaceholder", { name: reporterLabel })}
        sendLabel={t("report.sendMessage")}
        attachLabel={t("report.attach")}
        removeLabel={t("report.attachRemove")}
        onAttachError={() => toast(t("report.attachHint"), "error")}
        maxLength={REPORT_MESSAGE_MAX_LENGTH}
        busy={busy}
        allowEmpty={statusChanged}
        onSend={send}
        extraActions={
          internal
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
          <>
            <Select
              aria-label={t("report.staff.statusLabel")}
              value={internal ? status : target}
              disabled={internal}
              onChange={(value) => setTarget(REPORT_STATUSES.find((entry) => entry === value) ?? status)}
              options={REPORT_STATUSES.map((entry) => ({
                value: entry,
                label: t(REPORT_STATUS_LABELS[entry])
              }))}
            />
            <Select
              aria-label={t("report.staff.visibilityLabel")}
              value={visibility}
              onChange={(value) => setVisibility(value === "internal" ? "internal" : "public")}
              options={[
                {
                  value: "public",
                  label: t("report.staff.publicMode")
                },
                {
                  value: "internal",
                  label: t("report.staff.noteMode")
                }
              ]}
            />
          </>
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