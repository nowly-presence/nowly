import type { AppearanceMode } from "@/shared/types";
import { useEffect } from "react";

const MEDIA_QUERY = "(prefers-color-scheme: light)";

/**
 * Applies the light/dark surface to the side panel root, mirroring the
 * nowly.me appearance model. "system" follows the OS preference live.
 */
export const useAppearance = (appearance: AppearanceMode = "system"): void => {
  useEffect(() => {
    const root = document.documentElement;

    const apply = (isLight: boolean): void => {
      root.classList.toggle("light", isLight);
    };

    if (appearance !== "system") {
      apply(appearance === "light");
      return;
    }

    const media = window.matchMedia(MEDIA_QUERY);
    apply(media.matches);

    const onChange = (event: MediaQueryListEvent): void => apply(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [appearance]);
};
