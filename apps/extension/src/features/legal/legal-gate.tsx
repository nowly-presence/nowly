import type { ReactNode } from "react";
import { pendingLegalDocuments } from "@nowly/shared/legal";
import { Wordmark } from "@/components/shared/wordmark";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useResolvedTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/i18n-provider";
import { Button, Spinner } from "@/ui/button";
import { useLegalDocuments } from "@/features/legal/use-legal-documents";
import { LegalPrompt } from "@/features/legal/legal-prompt";

export const LegalGate = ({ children }: {
  children: ReactNode;
}) => {
  const { state: extension } = useExtensionState();
  const theme = useResolvedTheme(extension.settings.appearance);
  const { t } = useI18n();
  const { state, failed, retry, confirm } = useLegalDocuments();
  const pending = state ? pendingLegalDocuments(state) : [];

  if (state && pending.length === 0) return children;

  const returning = Boolean(state?.tosAcceptance || state?.privacyAcknowledgement || extension.onboarding.onboardingCompleted);
  return (
    <main className="relative h-full bg-canvas">
      <header className="flex h-14 items-center px-5">
        <Wordmark theme={theme} />
      </header>
      {state && extension.ready ? (
        <LegalPrompt
          key={pending.map((id) => `${id}:${state.manifest.documents[id].version}`).join(",")}
          state={state}
          returning={returning}
          confirm={confirm}
        />
      ) : (
        <div role="status" className="flex h-full flex-col items-center justify-center gap-4 px-5 text-body-sm text-muted">
          {failed ? (
            <>
              <p>{t("legal.error")}</p>
              <Button onClick={() => void retry()}>{t("legal.review")}</Button>
            </>
          ) : (
            <Spinner className="size-5 text-primary" />
          )}
        </div>
      )}
    </main>
  );
};