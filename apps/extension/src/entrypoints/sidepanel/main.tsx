import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/entrypoints/sidepanel/app";
import "@fontsource/instrument-sans/latin.css";
import "@/entrypoints/sidepanel/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
