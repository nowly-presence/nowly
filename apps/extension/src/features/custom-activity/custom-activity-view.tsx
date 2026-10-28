import { ScreenBody, ScreenTitle } from "@/components/shared/screen";
import { CustomActivityDropOverlay } from "@/features/custom-activity/custom-activity-drop-overlay";
import { CustomActivityEmptyState } from "@/features/custom-activity/custom-activity-empty-state";
import { CustomActivityRow } from "@/features/custom-activity/custom-activity-row";
import type { CustomActivityTemplateId } from "@/features/custom-activity/custom-activity-templates";
import { CustomActivityTemplatesSheet } from "@/features/custom-activity/custom-activity-templates-sheet";
import { useCustomActivityActions } from "@/features/custom-activity/use-custom-activity-actions";
import { useCustomActivityShare } from "@/features/custom-activity/use-custom-activity-share";
import { useFileDrop } from "@/features/custom-activity/use-file-drop";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { CUSTOM_ACTIVITIES_MAX } from "@/shared/custom-activity";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { Section } from "@/ui/section";
import { Skeleton } from "@/ui/skeleton";
import { RiAddLine, RiInformationLine, RiUpload2Line } from "@remixicon/react";
import { useRef, useState, type ChangeEvent } from "react";

export const CustomActivityView = () => {
  const { state } = useExtensionState();
  const { t } = useI18n();
  const { push, tab, stack } = useNav();
  const actions = useCustomActivityActions();
  const { items, activeId } = state.customActivities;
  const detection = state.detection;
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const open = (id: string | null) =>
    push({
      name: "custom-activity",
      id
    });

  const pickTemplate = (template: CustomActivityTemplateId | null) => {
    setTemplatesOpen(false);
    push({
      name: "custom-activity",
      id: null,
      template: template ?? undefined
    });
  };

  const duplicateActivity = (activity: (typeof items)[number]) => {
    setTemplatesOpen(false);
    push({
      name: "custom-activity",
      id: null,
      template: `duplicate:${activity.id}`
    });
  };

  const canCreate = items.length < CUSTOM_ACTIVITIES_MAX;
  const fileRef = useRef<HTMLInputElement>(null);
  const share = useCustomActivityShare((activity) => open(activity.id));

  const dragging = useFileDrop(
    (files) => void share.importFiles(files),
    state.ready && tab === "custom" && stack.length === 0 && !templatesOpen && !share.importing
  );

  const pickFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length > 0) void share.importFiles(files);
  };

  if (!state.ready) {
    return (
      <ScreenBody>
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-48" />
      </ScreenBody>
    );
  }

  return (
    <ScreenBody className="gap-5">
      <ScreenTitle title={t("custom.title")} subtitle={t("custom.subtitle")} />

      {items.length === 0 ? (
        <CustomActivityEmptyState onCreate={() => open(null)} onTemplates={() => setTemplatesOpen(true)} />
      ) : (
        <Section title={t("custom.list.title", { count: items.length })}>
          <Group>
            {items.map((activity) => (
              <CustomActivityRow
                key={activity.id}
                activity={activity}
                active={activity.id === activeId}
                detectedHost={detection?.activityId === activity.id ? detection.host : undefined}
                paused={state.settings.presencePaused === true}
                onOpen={() => open(activity.id)}
                onToggle={(checked) => void actions.setActive(checked ? activity.id : null)}
              />
            ))}

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <p className="min-w-0 flex-1 text-label-md text-muted">{t("custom.list.createAnother")}</p>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RiUpload2Line />}
                  loading={share.importing}
                  disabled={!canCreate}
                  onClick={() => fileRef.current?.click()}
                >
                  {t("custom.import")}
                </Button>
                {canCreate && (
                  <Button size="sm" icon={<RiAddLine />} onClick={() => setTemplatesOpen(true)}>
                    {t("custom.create")}
                  </Button>
                )}
              </div>
            </div>
          </Group>

          <div className="flex items-start gap-3 rounded-sm border border-line bg-surface px-4 py-3 text-label-md text-muted">
            <RiInformationLine className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>{t("custom.list.replacesTabs")}</p>
          </div>
        </Section>
      )}

      <input ref={fileRef} type="file" accept=".json,application/json" multiple hidden onChange={pickFiles} />

      {dragging && <CustomActivityDropOverlay />}

      <CustomActivityTemplatesSheet
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onPick={pickTemplate}
        activities={items}
        onDuplicate={duplicateActivity}
      />
    </ScreenBody>
  );
};