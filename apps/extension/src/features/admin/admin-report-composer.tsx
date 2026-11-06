import { useState } from "react";
import { RiQuestionAnswerLine } from "@remixicon/react";
import { ChatPromptInput } from "@/components/shared/chat/chat-prompt-input";
import { REPORT_STATUS_LABELS } from "@/components/shared/report-status-badge";
import { useI18n } from "@/hooks/i18n-provider";
import { REPORT_MESSAGE_MAX_LENGTH, REPORT_STATUSES, type ReportStatus } from "@/shared/reports";
import { Button } from "@/ui/button";
import { Select } from "@/ui/select";
import { AdminReportAskSheet } from "@/features/admin/admin-report-ask-sheet";
import type { StaffSend } from "@/features/admin/use-admin-report-thread";

type AdminReportComposerProps = {
  status: ReportStatus;
  reporterLabel: string;
  busy: boolean;
  onSend: (input: StaffSend) => Promise<boolean>;
};

export const AdminReportComposer = ({ status, reporterLabel, busy, onSend }: AdminReportComposerProps) => {
  const { t } = useI18n();
  const [target, setTarget] = useState<ReportStatus>(status);
  const [visibility, setVisibility] = useState<"public" | "internal">("public");
  const [asking, setAsking] = useState(false);
  const internal = visibility === "internal";
  const statusChanged = !internal && target !== status;

  const send = async (message: string): Promise<boolean> => {
    const sent = await onSend({ message, visibility, ...(statusChanged ? { statusTo: target } : {}) });

    if (sent) setVisibility("public");

    return sent;
  };

  return (
    <>
      <ChatPromptInput
        placeholder={internal ? t("report.staff.noteHint") : t("report.staff.replyPlaceholder", { name: reporterLabel })}
        sendLabel={t("report.sendMessage")}
        maxLength={REPORT_MESSAGE_MAX_LENGTH}
        busy={busy}
        allowEmpty={statusChanged}
        onSend={send}
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
      <Button variant="ghost" size="sm" disabled={busy || internal} icon={<RiQuestionAnswerLine className="size-4" />} onClick={() => setAsking(true)}>
        {t("report.staff.askInfo")}
      </Button>
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