import { useRef, useState, type ChangeEvent } from "react";
import { RiAddLine, RiUpload2Line } from "@remixicon/react";
import { CustomActivityLiveCard } from "@/components/shared/custom-activity-live-card";
import { ScreenBody, ScreenTitle } from "@/components/shared/screen";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { CUSTOM_ACTIVITIES_MAX, customActivityIdOf } from "@/shared/custom-activity";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { Section } from "@/ui/section";
import { Skeleton } from "@/ui/skeleton";
import { CustomActivityEmptyState } from "@/features/custom-activity/custom-activity-empty-state";
import { CustomActivityTemplatesSheet } from "@/features/custom-activity/custom-activity-templates-sheet";
import type { CustomActivityTemplateId } from "@/features/custom-activity/custom-activity-templates";
import { CustomActivityRow } from "@/features/custom-activity/custom-activity-row";
import { useCustomActivityActions } from "@/features/custom-activity/use-custom-activity-actions";
import { CustomActivityDropOverlay } from "@/features/custom-activity/custom-activity-drop-overlay";
import { useCustomActivityShare } from "@/features/custom-activity/use-custom-activity-share";
import { useFileDrop } from "@/features/custom-activity/use-file-drop";

export const CustomActivityView = () => {
  const { state, updateSettings } = useExtensionState();
  const { t } = useI18n();
  const { push, tab, stack } = useNav();
  const actions = useCustomActivityActions();
  const { items, activeId } = state.customActivities;
  const paused = state.settings.presencePaused === true;
  const detection = state.detection;
  const active = items.find((item) => item.id === activeId);
  const running = active ?? items.find((item) => item.id === detection?.activityId);
  const detectedHost = detection && detection.activityId === running?.id ? detection.host : undefined;
  const livePresence = state.activity && customActivityIdOf(state.activity.slug) === running?.id ? state.activity.presence : null;
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
      <ScreenTitle
        title={t("custom.title")}
        subtitle={t("custom.subtitle")}
        action={
          <div className="flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label={t("custom.import")}
              title={t("custom.import")}
              loading={share.importing}
              disabled={!canCreate}
              icon={<RiUpload2Line />}
              onClick={() => fileRef.current?.click()}
            />
            {items.length > 0 && canCreate && (
              <Button size="sm" icon={<RiAddLine />} onClick={() => setTemplatesOpen(true)}>
                {t("custom.create")}
              </Button>
            )}
          </div>
        }
      />

      {running && livePresence && (
        <Section title={t("custom.live.section")}>
          <CustomActivityLiveCard
            activity={running}
            presence={livePresence}
            paused={paused}
            detectedHost={detectedHost}
            onOpen={() => open(running.id)}
            onStop={() => void actions.setActive(null)}
            onResume={() => void updateSettings({ presencePaused: false })}
          />
        </Section>
      )}

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
                paused={paused}
                onOpen={() => open(activity.id)}
                onToggle={(checked) => void actions.setActive(checked ? activity.id : null)}
              />
            ))}
          </Group>
          <p className="px-1 text-label-md text-muted">{t("custom.list.replacesTabs")}</p>
        </Section>
      )}
      <input ref={fileRef} type="file" accept=".json,application/json" multiple hidden onChange={pickFiles} />
      {dragging && <CustomActivityDropOverlay />}
      <CustomActivityTemplatesSheet open={templatesOpen} onClose={() => setTemplatesOpen(false)} onPick={pickTemplate} />
    </ScreenBody>
  );
};
