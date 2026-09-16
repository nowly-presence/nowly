import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/entrypoints/sidepanel/app";
import { loadPersistedAppView } from "@/shared/sidepanel-view";
import "@fontsource/instrument-sans/latin.css";
import "@/entrypoints/sidepanel/styles.css";

document.title = chrome.i18n.getMessage("extensionName") || "Nowly"
if (import.meta.env.VITE_NOWLY_CHANNEL === "canary") {
  document.documentElement.dataset.channel = "canary"
}

void loadPersistedAppView().then((initialView) => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App initialView={initialView} />
    </StrictMode>,
  );
});
