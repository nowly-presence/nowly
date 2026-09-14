import { togglePresencePaused } from "@/background/managers/presence-pause";
import { openNowlyPanel } from "@/background/services/open-panel";

export const OPEN_PANEL_COMMAND = "open-side-panel";
export const TOGGLE_PAUSE_COMMAND = "toggle-presence-pause";

export const registerCommandHandlers = (): void => {
  chrome.commands.onCommand.addListener((command, tab) => {
    if (command === TOGGLE_PAUSE_COMMAND) {
      void togglePresencePaused();
      return;
    }
    if (command === OPEN_PANEL_COMMAND) {
      void openNowlyPanel(tab);
    }
  });
};
