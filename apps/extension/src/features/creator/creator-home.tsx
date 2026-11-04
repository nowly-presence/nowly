import { useRef, useState, type ChangeEvent } from "react";
import { RiAddLine, RiCursorLine, RiDeleteBinLine, RiDownload2Line, RiGitPullRequestLine, RiImageLine, RiMagicLine, RiSendPlaneLine, RiUpload2Line } from "@remixicon/react";
import { ScreenBody, ScreenTitle } from "@/components/shared/screen";
import { openUrl } from "@/shared/browser-links";
import { useI18n } from "@/hooks/i18n-provider";
import { formatDate } from "@/lib/format";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { ButtonGroup } from "@/ui/button-group";
import { Card, Group } from "@/ui/card";
import { IconTile } from "@/ui/icon-tile";
import { Row } from "@/ui/row";
import { Section } from "@/ui/section";
import { Sheet } from "@/ui/sheet";
import { Skeleton } from "@/ui/skeleton";
import { SUBMISSION_TONES, statusKey } from "@/lib/submission-status";
import { DraftLogo } from "@/features/creator/review/draft-preview";

type CreatorHomeProps = {
  drafts: CreatorDraft[];
  ready: boolean;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onImport: (file: File) => void;
  onExport: (draft: CreatorDraft) => void;
};

const LOGO_SIZE = 40;

const DraftRow = ({ draft, onOpen, onExport, onDelete }: {
  draft: CreatorDraft;
  onOpen: () => void;
  onExport: () => void;
  onDelete: () => void;
}) => {
  const { t, locale } = useI18n();
  const name = draft.name.trim() || t("creator.untitled");

  return (
    <Row
      leading={<DraftLogo draft={draft} size={LOGO_SIZE} rounded="rounded-md" />}
      title={name}
      description={
        <span className="flex flex-col items-start gap-1">
          {t("creator.home.edited", { date: formatDate(new Date(draft.updatedAt).toISOString(), locale) ?? "" })}
          <Badge tone={draft.submission ? SUBMISSION_TONES[draft.submission.status] : "neutral"}>{t(statusKey(draft))}</Badge>
        </span>
      }
      align="start"
      onClick={onOpen}
      trailing={
        <ButtonGroup label={name}>
          {draft.submission?.prUrl && (
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={t("creator.home.openPullRequest")}
              title={t("creator.home.openPullRequest")}
              onClick={(event) => {
                event.stopPropagation();
                if (draft.submission?.prUrl) openUrl(draft.submission.prUrl);
              }}
            >
              <RiGitPullRequestLine className="size-4" />
            </Button>
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t("creator.home.export")}
            title={t("creator.home.export")}
            onClick={(event) => {
              event.stopPropagation();
              onExport();
            }}
          >
            <RiDownload2Line className="size-4" />
          </Button>
          {!draft.submission && (
            <Button
              size="icon-sm"
              variant="ghost"
              className="hover:text-danger"
              aria-label={t("creator.home.delete")}
              title={t("creator.home.delete")}
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
            >
              <RiDeleteBinLine className="size-4" />
            </Button>
          )}
        </ButtonGroup>
      }
    />
  );
};

const Welcome = ({ onCreate }: {
  onCreate: () => void;
}) => {
  const { t } = useI18n();
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
    <Card className="flex flex-col gap-5 p-5">
      <span className="flex size-11 items-center justify-center rounded-md bg-primary-soft text-primary">
        <RiMagicLine className="size-5" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-headline-sm font-medium tracking-[-0.3px] text-balance">{t("creator.home.title")}</h2>
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
    </Card>
  );
};

export const CreatorHome = ({ drafts, ready, onCreate, onOpen, onDelete, onImport, onExport }: CreatorHomeProps) => {
  const { t } = useI18n();
  const [pendingDelete, setPendingDelete] = useState<CreatorDraft | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (file) onImport(file);
  };

  return (
    <ScreenBody className="gap-5">
      <ScreenTitle
        title={t("creator.title")}
        subtitle={t("creator.home.subtitle")}
        action={
          drafts.length > 0 ? (
            <Button size="sm" icon={<RiAddLine className="size-3.5" />} onClick={onCreate}>
              {t("creator.home.create")}
            </Button>
          ) : undefined
        }
      />
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={pickFile} />

      {!ready ? (
        <Skeleton className="h-48" />
      ) : drafts.length === 0 ? (
        <Welcome onCreate={onCreate} />
      ) : (
        <>
          <Section title={t("creator.home.mine")}>
            <Group>
              {drafts.map((draft) => (
                <DraftRow
                  key={draft.id}
                  draft={draft}
                  onOpen={() => onOpen(draft.id)}
                  onExport={() => onExport(draft)}
                  onDelete={() => setPendingDelete(draft)}
                />
              ))}
            </Group>
          </Section>
        </>
      )}

      {ready && (
        <Group>
          <Row
            leading={<IconTile icon={<RiUpload2Line className="size-[18px] text-muted" />} />}
            title={t("creator.home.import")}
            description={t("creator.home.importHint")}
            onClick={() => fileRef.current?.click()}
          />
        </Group>
      )}

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
    </ScreenBody>
  );
};