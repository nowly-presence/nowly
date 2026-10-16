import { useMemo, useState } from "react";
import { RiDeleteBinLine, RiDownload2Line } from "@remixicon/react";
import { CustomActivityArtwork } from "@/components/shared/custom-activity-artwork";
import { LiveCard } from "@/components/shared/live-activity-card";
import { BackHeader, ScreenBody } from "@/components/shared/screen";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { buildCustomPresence, customActivitySlug, emptyCustomActivityDraft, hasCustomActivityErrors, validateCustomActivity } from "@/shared/custom-activity";
import type { CustomActivityDraft } from "@/shared/types";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { SwitchRow } from "@/ui/row";
import { Section } from "@/ui/section";
import { CustomActivityButtonsSection } from "@/features/custom-activity/custom-activity-buttons-section";
import { CustomActivityDeleteSheet } from "@/features/custom-activity/custom-activity-delete-sheet";
import { CustomActivityImagesSection } from "@/features/custom-activity/custom-activity-images-section";
import { CustomActivityTextSection } from "@/features/custom-activity/custom-activity-text-section";
import { CustomActivityTimeSection } from "@/features/custom-activity/custom-activity-time-section";
import { draftFromTemplate, isCustomActivityTemplateId } from "@/features/custom-activity/custom-activity-templates";
import { useCustomActivityActions } from "@/features/custom-activity/use-custom-activity-actions";
import { useCustomActivityShare } from "@/features/custom-activity/use-custom-activity-share";

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
  const [draft, setDraft] = useState<CustomActivityDraft>(
    () =>
      existing ??
      (isCustomActivityTemplateId(template)
        ? draftFromTemplate(template, t)
        : emptyCustomActivityDraft())
  );
  const [showErrors, setShowErrors] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [previewStart] = useState(() => Date.now());
  const errors = useMemo(() => validateCustomActivity(draft), [draft]);
  const visibleErrors = showErrors ? errors : {};
  const active = Boolean(draft.id) && state.customActivities.activeId === draft.id;

  const patch = (partial: Partial<CustomActivityDraft>) => setDraft((current) => ({ ...current, ...partial }));

  const save = async () => {
    if (hasCustomActivityErrors(errors)) {
      setShowErrors(true);
      return;
    }

    const saved = await actions.save(draft);
    if (saved) pop();
  };

  const remove = async () => {
    if (!existing) return;

    await actions.remove(existing);
    setDeleteOpen(false);
    pop();
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
          <Button size="sm" loading={actions.pending === "save"} onClick={() => void save()}>
            {t("action.save")}
          </Button>
        }
      />

      <ScreenBody className="gap-6 pt-0">
        <Section title={t("custom.editor.preview")} className="sticky top-14 z-10 bg-canvas py-2">
          <LiveCard
            slug={customActivitySlug(draft.id ?? "draft")}
            presence={presence}
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
                active
                  ? t("custom.list.activeHint")
                  : t("custom.list.inactiveHint")
              }
              checked={active}
              label={t("custom.list.showOnDiscord")}
              onChange={(checked) => void actions.setActive(checked ? existing.id : null)}
            />
          </Group>
        )}

        <CustomActivityTextSection draft={draft} patch={patch} errors={visibleErrors} />
        <CustomActivityImagesSection draft={draft} patch={patch} errors={visibleErrors} upload={actions.upload} uploading={actions.pending === "upload"} />
        <CustomActivityTimeSection draft={draft} patch={patch} errors={visibleErrors} />
        <CustomActivityButtonsSection draft={draft} patch={patch} errors={visibleErrors} />

        <div className="flex flex-col gap-2">
          {showErrors && hasCustomActivityErrors(errors) && <p className="text-center text-label-md text-danger">{t("custom.editor.fixErrors")}</p>}
          <Button loading={actions.pending === "save"} onClick={() => void save()}>
            {existing ? t("action.save") : t("custom.editor.create")}
          </Button>
          {existing && (
            <Button variant="secondary" icon={<RiDownload2Line className="size-4" />} onClick={() => void share.exportActivity(existing)}>
              {t("custom.export")}
            </Button>
          )}
          {existing && (
            <Button variant="danger" icon={<RiDeleteBinLine className="size-4" />} onClick={() => setDeleteOpen(true)}>
              {t("custom.editor.delete")}
            </Button>
          )}
        </div>
      </ScreenBody>

      {existing && (
        <CustomActivityDeleteSheet
          name={existing.name}
          open={deleteOpen}
          pending={actions.pending === "delete"}
          onClose={() => setDeleteOpen(false)}
          onConfirm={remove}
        />
      )}
    </div>
  );
};