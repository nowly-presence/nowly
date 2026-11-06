import { useState } from "react";
import { useI18n } from "@/hooks/i18n-provider";
import { REPORT_CHOICES_MAX, REPORT_CHOICES_MIN, REPORT_MESSAGE_MAX_LENGTH } from "@/shared/reports";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/sheet";
import { Textarea } from "@/ui/textarea";

type AdminReportAskSheetProps = {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSend: (question: string, choices: string[]) => Promise<boolean>;
};

const parseChoices = (value: string): string[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, REPORT_CHOICES_MAX);

export const AdminReportAskSheet = ({ open, busy, onClose, onSend }: AdminReportAskSheetProps) => {
  const { t } = useI18n();
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState("");
  const parsed = parseChoices(choices);
  const valid = question.trim().length > 0 && parsed.length >= REPORT_CHOICES_MIN;

  const submit = async () => {
    if (!(await onSend(question.trim(), parsed))) return;

    setQuestion("");
    setChoices("");
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("report.staff.askInfo")}
      description={t("report.staff.askHint")}
      closeLabel={t("action.close")}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t("action.cancel")}
          </Button>
          <Button className="flex-1" disabled={!valid} loading={busy} onClick={() => void submit()}>
            {t("report.staff.askSend")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Textarea
          value={question}
          maxLength={REPORT_MESSAGE_MAX_LENGTH}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={t("report.staff.askQuestion")}
          aria-label={t("report.staff.askQuestion")}
          className="min-h-20"
          autoFocus
        />
        <Textarea
          value={choices}
          onChange={(event) => setChoices(event.target.value)}
          placeholder={t("report.staff.askChoices")}
          aria-label={t("report.staff.askChoices")}
          className="min-h-24"
        />
      </div>
    </Sheet>
  );
};