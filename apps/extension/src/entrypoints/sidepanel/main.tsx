import "@/shared/validation-runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/entrypoints/sidepanel/app";
import { UnavailableView } from "@/features/unavailable/unavailable-view";
import { isFirefoxMobile } from "@/shared/platform";
import { ToastProvider } from "@/ui/toast";
import { I18nProvider } from "@/hooks/i18n-provider";
import { NavigationProvider } from "@/hooks/navigation-provider";
import { ExtensionStateProvider } from "@/hooks/extension-state-provider";
import { SeasonProvider } from "@/hooks/season-provider";
import "@/entrypoints/sidepanel/styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Missing #root element");

const root = createRoot(rootElement);

if (isFirefoxMobile()) {
  root.render(
    <StrictMode>
      <I18nProvider>
        <UnavailableView />
      </I18nProvider>
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <I18nProvider>
        <ExtensionStateProvider>
          <SeasonProvider>
            <NavigationProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </NavigationProvider>
          </SeasonProvider>
        </ExtensionStateProvider>
      </I18nProvider>
    </StrictMode>
  );
}