import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "@/entrypoints/sidepanel/app"
import { ToastProvider } from "@/ui/toast"
import { I18nProvider } from "@/hooks/i18n-provider"
import { NavigationProvider } from "@/hooks/navigation-provider"
import { ExtensionStateProvider } from "@/hooks/extension-state-provider"
import "@/entrypoints/sidepanel/styles.css"

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error("Missing #root element")

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider>
      <ExtensionStateProvider>
        <NavigationProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </NavigationProvider>
      </ExtensionStateProvider>
    </I18nProvider>
  </StrictMode>,
)
