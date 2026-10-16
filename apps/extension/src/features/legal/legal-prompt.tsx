import { useId, useState } from "react";
import { RiCheckLine, RiFileShield2Line } from "@remixicon/react";
import { pendingLegalDocuments, type LegalConfirmation, type LegalConfirmationResult, type LegalState } from "@nowly/shared/legal";
import { useI18n } from "@/hooks/i18n-provider";
import { Modal } from "@/ui/modal";
import { Button } from "@/ui/button";
import { LegalDocumentCard } from "@/features/legal/legal-document-card";

export const LegalPrompt = ({ state, returning, confirm }: {
  state: LegalState;
  returning: boolean;
  confirm: (input: LegalConfirmation) => Promise<LegalConfirmationResult>;
}) => {
  const { t } = useI18n();
  const titleId = useId();
  const descriptionId = useId();
  const [tos, setTos] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const pending = pendingLegalDocuments(state);
  const needsTos = pending.includes("tos");
  const needsPrivacy = pending.includes("privacy");
  const allowed = (!needsTos || tos) && (!needsPrivacy || privacy);
  const submit = async () => {
    if (!allowed || busy) return;

    setBusy(true);
    setError(false);

    try {
      const result = await confirm({
        versions: Object.fromEntries(pending.map((id) => [id, state.manifest.documents[id].version])),
        acceptTos: tos,
        acknowledgePrivacy: privacy
      });

      if (!result.ok) {
        setTos(false);
        setPrivacy(false);
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal titleId={titleId} descriptionId={descriptionId}>
      <div className="px-5 pt-6 pb-5">
        <div className="mb-5 flex items-center">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <RiFileShield2Line className="size-6" aria-hidden />
          </span>
        </div>
        <h1 id={titleId} className="text-headline-sm font-medium tracking-[-0.3px] text-ink">
          {t(returning ? "legal.updateTitle" : "legal.firstTitle")}
        </h1>
        <p id={descriptionId} className="mt-2 text-body-sm text-muted">
          {t(returning ? "legal.updateDescription" : "legal.firstDescription")}
        </p>
        <div className="mt-5 flex flex-col gap-3">
          {pending.map((id) => (
            <LegalDocumentCard
              key={id}
              id={id}
              document={state.manifest.documents[id]}
              checked={id === "tos" ? tos : privacy}
              onChange={id === "tos" ? setTos : setPrivacy}
              disabled={busy}
            />
          ))}
        </div>
        {state.checkFailed && (
          <p role="status" className="mt-3 text-label-sm text-muted">
            {t("legal.offline")}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-label-md text-danger">
            {t("legal.error")}
          </p>
        )}
      </div>
      <div className="border-t border-line px-5 py-4">
        <Button className="w-full" disabled={!allowed} loading={busy} onClick={() => void submit()} icon={<RiCheckLine className="size-4" aria-hidden />}>
          {t(needsTos ? "legal.acceptContinue" : "legal.continue")}
        </Button>
        <p className="mt-2 text-center text-label-sm text-muted">{t("legal.analytics")}</p>
      </div>
    </Modal>
  );
};