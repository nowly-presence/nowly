import { useRef, useState, type ChangeEvent } from "react";
import { RiAddLine, RiCursorLine, RiDeleteBinLine, RiDownload2Line, RiImageLine, RiMagicLine, RiPencilLine, RiSendPlaneLine, RiUpload2Line } from "@remixicon/react";
import { BackHeader, ScreenBody } from "@/components/shared/screen";
import { useI18n } from "@/hooks/i18n-provider";
import { formatDate } from "@/lib/format";
import { canEditSubmission } from "@nowly/presence-creator/creator-submission";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, Group } from "@/ui/card";
import { Row } from "@/ui/row";
import { Section } from "@/ui/section";
import { Sheet } from "@/ui/sheet";
import { Skeleton } from "@/ui/skeleton";
import { SUBMISSION_TONES, statusKey } from "@/lib/submission-status";

type CreatorHomeProps = {
  drafts: CreatorDraft[];
  ready: boolean;
  onBack: () => void;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onImport: (file: File) => void;
  onExport: (draft: CreatorDraft) => void;
};

const DraftIcon = ({ draft }: { draft: CreatorDraft }) =>
  draft.assets.icon ? (
    <img src={draft.assets.icon} alt="" className="size-10 rounded-md object-contain" style={{ backgroundColor: draft.color }} />
  ) : (
    <span className="flex size-10 items-center justify-center rounded-md text-label-lg font-medium text-white" style={{ backgroundColor: draft.color }}>
      {draft.name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );

export const CreatorHome = ({ drafts, ready, onBack, onCreate, onOpen, onDelete, onImport, onExport }: CreatorHomeProps) => {
  const { t, locale } = useI18n();
  const [pendingDelete, setPendingDelete] = useState<CreatorDraft | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (file) onImport(file);
  };
  const steps = [
    {
      icon: <RiImageLine className="size-4" />,
      label: t("creator.home.stepVisuals")
    },
    {
      icon: <RiCursorLine className="size-4" />,
      label: t("creator.home.stepPages")
    },
    {
      icon: <RiSendPlaneLine className="size-4" />,
      label: t("creator.home.stepSubmit")
    }
  ];

  return (
    <div className="flex min-h-full flex-col">
      <BackHeader title={t("creator.title")} onBack={onBack} backLabel={t("action.back")} />
      <ScreenBody className="pt-0">
        <Card className="flex flex-col gap-4 p-5">
          <span className="flex size-11 items-center justify-center rounded-md bg-primary-soft text-primary">
            <RiMagicLine className="size-5" />
          </span>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-headline-sm font-medium tracking-[-0.3px] text-balance">{t("creator.home.title")}</h1>
            <p className="text-body-sm text-muted">{t("creator.home.description")}</p>
          </div>
          <ol className="flex flex-col gap-2.5">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center gap-3 text-body-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted">{step.icon}</span>
                {step.label}
              </li>
            ))}
          </ol>
          <Button icon={<RiAddLine className="size-4" />} onClick={onCreate}>
            {t("creator.home.create")}
          </Button>
          <Button variant="secondary" icon={<RiUpload2Line className="size-4" />} onClick={() => fileRef.current?.click()}>
            {t("creator.home.import")}
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={pickFile} />
        </Card>

        {!ready ? (
          <Skeleton className="h-16" />
        ) : (
          drafts.length > 0 && (
            <Section title={t("creator.home.mine")}>
              <Group>
                {drafts.map((draft) => (
                  <Row
                    key={draft.id}
                    leading={<DraftIcon draft={draft} />}
                    title={draft.name.trim() || t("creator.untitled")}
                    description={
                      <span className="flex flex-col items-start gap-1">
                        {t("creator.home.edited", { date: formatDate(new Date(draft.updatedAt).toISOString(), locale) ?? "" })}
                        <Badge tone={draft.submission ? SUBMISSION_TONES[draft.submission.status] : "neutral"}>{t(statusKey(draft))}</Badge>
                      </span>
                    }
                    align="start"
                    onClick={() => onOpen(draft.id)}
                    trailing={
                      <span className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<RiPencilLine className="size-3.5" />}
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpen(draft.id);
                          }}
                        >
                          {canEditSubmission(draft.submission) ? t("creator.home.edit") : t("creator.home.view")}
                        </Button>
                        <button
                          type="button"
                          aria-label={t("creator.home.export")}
                          title={t("creator.home.export")}
                          onClick={(event) => {
                            event.stopPropagation();
                            onExport(draft);
                          }}
                          className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-foreground"
                        >
                          <RiDownload2Line className="size-4" />
                        </button>
                        {!draft.submission && (
                          <button
                            type="button"
                            aria-label={t("creator.home.delete")}
                            onClick={(event) => {
                              event.stopPropagation();
                              setPendingDelete(draft);
                            }}
                            className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-danger"
                          >
                            <RiDeleteBinLine className="size-4" />
                          </button>
                        )}
                      </span>
                    }
                  />
                ))}
              </Group>
            </Section>
          )
        )}
      </ScreenBody>

      <Sheet
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={t("creator.home.deleteTitle", { name: pendingDelete?.name.trim() || t("creator.untitled") })}
        description={t("creator.home.deleteDescription")}
        closeLabel={t("action.close")}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setPendingDelete(null)}>
              {t("action.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                if (pendingDelete) onDelete(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              {t("creator.home.delete")}
            </Button>
          </>
        }
      />
    </div>
  );
};