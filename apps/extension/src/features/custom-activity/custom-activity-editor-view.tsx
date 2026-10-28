import { CustomActivityArtwork } from "@/components/shared/custom-activity-artwork";
import { LiveCard } from "@/components/shared/live-activity-card";
import { BackHeader, ScreenBody } from "@/components/shared/screen";
import { CustomActivityButtonsSection } from "@/features/custom-activity/custom-activity-buttons-section";
import { CustomActivityDeleteSheet } from "@/features/custom-activity/custom-activity-delete-sheet";
import { CustomActivityDetectionSection } from "@/features/custom-activity/custom-activity-detection-section";
import { CustomActivityImagesSection } from "@/features/custom-activity/custom-activity-images-section";
import { CustomActivityPublication } from "@/features/custom-activity/custom-activity-publication";
import { draftFromTemplate, isCustomActivityTemplateId } from "@/features/custom-activity/custom-activity-templates";
import { CustomActivityTextSection } from "@/features/custom-activity/custom-activity-text-section";
import { CustomActivityTimeSection } from "@/features/custom-activity/custom-activity-time-section";
import { useCustomActivityActions } from "@/features/custom-activity/use-custom-activity-actions";
import { useCustomActivityEditorLock } from "@/features/custom-activity/use-custom-activity-editor-lock";
import { useCustomActivityShare } from "@/features/custom-activity/use-custom-activity-share";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { buildCustomPresence, customActivitySlug, emptyCustomActivityDraft, hasCustomActivityErrors, validateCustomActivity } from "@/shared/custom-activity";
import type { CustomActivityDraft } from "@/shared/types";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { SwitchRow } from "@/ui/row";
import { Section } from "@/ui/section";
import { RiDeleteBinLine, RiDownload2Line } from "@remixicon/react";
import { useMemo, useState } from "react";

export const CustomActivityEditorView = ({ id, template }: {
  id: string | null;
  template?: string;
}) => {
  const { state } = useExtensionState();
  const { t } = useI18n();
  const { pop } = useNav();
  const actions = useCustomActivityActions();
  const share = useCustomActivityShare(pop);
  const existing = id ? state.customActivities.items.find((item) => item.id === id) : undefined;
  const duplicateSource = template?.startsWith("duplicate:")
    ? state.customActivities.items.find((item) => item.id === template.slice("duplicate:".length))
    : undefined;
  const editorReady = useCustomActivityEditorLock(id);
  const [baseUpdatedAt] = useState(existing?.updatedAt);
  const [draft, setDraft] = useState<CustomActivityDraft>(
    () =>
      existing ??
      (duplicateSource
        ? (({ id: _id, createdAt: _createdAt, updatedAt: _updatedAt, provenance: _provenance, ...activity }) => activity)(duplicateSource)
        : isCustomActivityTemplateId(template)
          ? draftFromTemplate(template, t)
          : emptyCustomActivityDraft())
  );
  const [showErrors, setShowErrors] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePreparing, setDeletePreparing] = useState(false);
  const [previewStart] = useState(() => Date.now());
  const errors = useMemo(() => validateCustomActivity(draft), [draft]);
  const visibleErrors = showErrors ? errors : {};
  const active = Boolean(draft.id) && state.customActivities.activeId === draft.id;
  const detectedHost = draft.id && state.detection?.activityId === draft.id ? state.detection.host : undefined;

  const patch = (partial: Partial<CustomActivityDraft>) => setDraft((current) => ({ ...current, ...partial }));

  const save = async () => {
    if (hasCustomActivityErrors(errors)) {
      setShowErrors(true);
      return;
    }

    if (!editorReady) return;

    const saved = await actions.save(draft, baseUpdatedAt);
    if (saved) pop();
  };

  const remove = async () => {
    if (!existing) return false;

    const removed = await actions.remove(existing);

    if (!removed) return false;

    setDeleteOpen(false);
    pop();
    return true;
  };

  const presence = buildCustomPresence(
    {
      ...draft,
      name: draft.name.trim() || t("custom.field.namePlaceholder")
    },
    previewStart
  );

  return (
    <div className="flex min-h-full flex-col">
      <BackHeader
        onBack={pop}
        backLabel={t("action.back")}
        title={existing ? t("custom.editor.editTitle") : t("custom.editor.newTitle")}
        action={
          <Button size="sm" disabled={!editorReady} loading={actions.pending === "save"} onClick={() => void save()}>
            {t("action.save")}
          </Button>
        }
      />

      <ScreenBody className="gap-6 pt-0">
        <Section title={t("custom.editor.preview")} className="sticky top-14 z-10 bg-canvas py-2">
          <LiveCard
            slug={customActivitySlug(draft.id ?? "draft")}
            presence={presence}
            timelineMode={draft.timestamp.mode === "countdown" ? "countdown" : "playback"}
            presenceName={presence.name ?? ""}
            t={t}
            artwork={<CustomActivityArtwork source={draft} size={64} rounded="rounded-md" showSmall ringClassName="border-tertiary bg-tertiary" />}
          />
        </Section>

        {existing && (
          <Group>
            <SwitchRow
              title={t("custom.list.showOnDiscord")}
              description={
                detectedHost ? t("custom.detection.runningHint", { host: detectedHost }) : active ? t("custom.list.activeHint") : t("custom.list.inactiveHint")
              }
              checked={active || Boolean(detectedHost)}
              label={t("custom.list.showOnDiscord")}
              onChange={(checked) => void actions.setActive(checked ? existing.id : null)}
            />
          </Group>
        )}

        <fieldset disabled={!editorReady} className="flex flex-col gap-6">
          <CustomActivityTextSection draft={draft} patch={patch} errors={visibleErrors} />
          <CustomActivityImagesSection draft={draft} patch={patch} errors={visibleErrors} upload={actions.upload} uploading={actions.pending === "upload"} />
          <CustomActivityTimeSection draft={draft} patch={patch} errors={visibleErrors} />
          <CustomActivityDetectionSection draft={draft} patch={patch} errors={visibleErrors} detectedHost={detectedHost} />
          <CustomActivityButtonsSection draft={draft} patch={patch} errors={visibleErrors} />
        </fieldset>

        <div className="flex flex-col gap-2">
          {showErrors && hasCustomActivityErrors(errors) && <p className="text-center text-label-md text-danger">{t("custom.editor.fixErrors")}</p>}
          {existing && <CustomActivityPublication id={existing.id} />}
          {existing && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="muted" icon={<RiDownload2Line />} onClick={() => void share.exportActivity(existing)}>
                {t("custom.export")}
              </Button>
              <Button
                variant="destructive"
                icon={<RiDeleteBinLine />}
                loading={deletePreparing}
                onClick={() => {
                  setDeletePreparing(true);
                  setDeleteOpen(true);
                }}
              >
                {t("action.delete")}
              </Button>
            </div>
          )}
        </div>
      </ScreenBody>

      {existing && deleteOpen && (
        <CustomActivityDeleteSheet
          id={existing.id}
          name={existing.name}
          pending={actions.pending === "delete"}
          onClose={() => setDeleteOpen(false)}
          onConfirm={remove}
          onPreparingChange={setDeletePreparing}
        />
      )}
    </div>
  );
};