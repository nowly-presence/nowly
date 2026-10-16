import { RiArrowRightUpLine, RiFileTextLine, RiShieldCheckLine } from "@remixicon/react";
import type { LegalDocument, LegalDocumentId } from "@nowly/shared/legal";
import { useI18n } from "@/hooks/i18n-provider";
import { WEB_BASE_URL } from "@/shared/constants";
import { Checkbox } from "@/ui/checkbox";

export const LegalDocumentCard = ({ id, document, checked, onChange, disabled }: { id: LegalDocumentId; document: LegalDocument; checked: boolean; onChange: (checked: boolean) => void; disabled: boolean }) => {
  const { t, locale } = useI18n();
  const prefix = locale === "en" ? "" : `/${locale === "pt-BR" ? "pt" : locale}`;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${document.updatedAt}T00:00:00Z`));
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <a href={`${WEB_BASE_URL.replace(/\/$/, "")}${prefix}${document.path}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
          {id === "tos" ? <RiFileTextLine className="size-5" aria-hidden /> : <RiShieldCheckLine className="size-5" aria-hidden />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-label-lg font-medium text-ink">{t(id === "tos" ? "legal.tos" : "legal.privacy")}</span>
          <span className="text-label-sm text-muted">{t("legal.updated", { date })}</span>
        </span>
        <RiArrowRightUpLine className="size-4 shrink-0 text-muted" aria-hidden />
      </a>
      <div className="border-t border-line bg-neutral/40 px-4 py-3">
        <Checkbox checked={checked} onChange={onChange} disabled={disabled}>{t(id === "tos" ? "legal.acceptTos" : "legal.acknowledgePrivacy")}</Checkbox>
      </div>
    </div>
  );
};
