import { useState } from "react";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { sendMessage } from "@/lib/messages";
import { REPORT_MESSAGE_MAX_LENGTH } from "@/shared/reports";
import { LOCALE_LONG_MAP } from "@/shared/locales";
import { Button } from "@/ui/button";
import { ChoiceCard } from "@/ui/choice-card";
import { Sheet } from "@/ui/sheet";
import { Textarea } from "@/ui/textarea";
import { useToast } from "@/ui/toast";

type PresenceReportSheetProps = {
  slug: string;
  name: string;
  open: boolean;
  onClose: () => void;
};

export const PresenceReportSheet = ({ slug, name, open, onClose }: PresenceReportSheetProps) => {
  const { t, locale } = useI18n();
  const { state } = useExtensionState();
  const { push } = useNav();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [notify, setNotify] = useState(true);
  const [sending, setSending] = useState(false);
  const pseudo = state.account.signedIn && state.account.user.discordId ? state.account.user.name : null;

  const submit = async () => {
    setSending(true);
    const result = await sendMessage("REPORT_CREATE", {
      slug,
      message,
      anonymous: anonymous || !pseudo,
      notify,
      locale: LOCALE_LONG_MAP[locale]
    }).catch(() => null);
    setSending(false);

    if (!result?.ok) {
      toast(t("error.report"), "error");
      return;
    }

    toast(t("toast.reportSent"));
    setMessage("");
    onClose();
    push({
      name: "report",
      id: result.report.id
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("report.title", { name })}
      description={t("report.description")}
      closeLabel={t("action.close")}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t("action.cancel")}
          </Button>
          <Button className="flex-1" disabled={!message.trim()} loading={sending} onClick={() => void submit()}>
            {t("report.send")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Textarea
            value={message}
            maxLength={REPORT_MESSAGE_MAX_LENGTH}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={t("report.placeholder")}
            aria-label={t("report.title", { name })}
            autoFocus
          />
          <span className="self-end text-label-sm text-muted tabular-nums">
            {message.length}/{REPORT_MESSAGE_MAX_LENGTH}
          </span>
        </div>
        <div role="radiogroup" aria-label={t("report.identityTitle")} className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5 px-1">
            <span className="text-label-lg font-medium text-ink">{t("report.identityTitle")}</span>
            <span className="text-label-md text-muted">{t("report.identityHint")}</span>
          </div>
          <ChoiceCard
            selected={!anonymous && pseudo !== null}
            onSelect={() => pseudo && setAnonymous(false)}
            title={t("report.identityNamed")}
            description={pseudo ? t("report.identityNamedHint", { name: pseudo }) : t("report.identityNamedUnavailable")}
          />
          <ChoiceCard
            selected={anonymous || pseudo === null}
            onSelect={() => setAnonymous(true)}
            title={t("report.identityAnonymous")}
            description={t("report.identityAnonymousHint")}
          />
        </div>
        <div role="radiogroup" aria-label={t("report.notifyTitle")} className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5 px-1">
            <span className="text-label-lg font-medium text-ink">{t("report.notifyTitle")}</span>
            <span className="text-label-md text-muted">{t("report.notifyHint")}</span>
          </div>
          <ChoiceCard selected={notify} onSelect={() => setNotify(true)} title={t("report.notifyYes")} description={t("report.notifyYesHint")} />
          <ChoiceCard selected={!notify} onSelect={() => setNotify(false)} title={t("report.notifyNo")} description={t("report.notifyNoHint")} />
        </div>
      </div>
    </Sheet>
  );
};