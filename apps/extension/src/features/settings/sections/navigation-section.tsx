import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { DOCK_TABS, isDefaultDockLayout, normalizeDockLayout, restoreDockLayoutTabs } from "@/shared/dock-layout";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { FieldRow } from "@/ui/field-row";
import { SwitchRow } from "@/ui/row";
import { Section } from "@/ui/section";

export const NavigationSection = () => {
  const { state, updateSettings } = useExtensionState();
  const { t } = useI18n();
  const hiddenDockTabs = state.settings.hiddenDockTabs ?? [];
  const defaultDock = hiddenDockTabs.length === 0 && isDefaultDockLayout(normalizeDockLayout(state.settings.dockLayout, DOCK_TABS), DOCK_TABS);

  const setDockTabVisible = (tab: "store" | "custom" | "announcements", visible: boolean) => {
    const hidden = visible ? hiddenDockTabs.filter((value) => value !== tab) : [...new Set([...hiddenDockTabs, tab])];
    void updateSettings({
      hiddenDockTabs: hidden,
      dockLayout: restoreDockLayoutTabs(state.settings.dockLayout, DOCK_TABS)
    });
  };

  return (
    <Section title={t("settings.navigation")}>
      <Group>
        <FieldRow title={t("settings.dockLayout")} description={t("settings.dockLayoutHint")}>
          <Button
            size="sm"
            variant="secondary"
            disabled={defaultDock}
            onClick={() =>
              void updateSettings({
                dockLayout: [[...DOCK_TABS]],
                hiddenDockTabs: []
              })
            }
          >
            {t("action.reset")}
          </Button>
        </FieldRow>
        <SwitchRow
          title={t("nav.library")}
          label={t("nav.library")}
          checked={!hiddenDockTabs.includes("store")}
          onChange={(checked) => setDockTabVisible("store", checked)}
        />
        <SwitchRow
          title={t("nav.custom")}
          label={t("nav.custom")}
          checked={!hiddenDockTabs.includes("custom")}
          onChange={(checked) => setDockTabVisible("custom", checked)}
        />
        <SwitchRow
          title={t("nav.announcements")}
          label={t("nav.announcements")}
          checked={!hiddenDockTabs.includes("announcements")}
          onChange={(checked) => setDockTabVisible("announcements", checked)}
        />
      </Group>
    </Section>
  );
};