import { RiAndroidFill, RiAppleFill, RiChromeFill, RiComputerFill, RiEdgeNewFill, RiFirefoxBrowserFill, RiGlobalFill, RiOperaFill, RiSafariFill, RiUbuntuFill, RiWindowsFill } from "@nowly/ui/icons";
import type { ComponentType } from "react";

type PlatformIcon = ComponentType<{
  className?: string;
}>;

type Platform = {
  label: string;
  icon: PlatformIcon;
};

const BROWSERS: Readonly<Record<string, Platform>> = {
  chrome: {
    label: "Chrome",
    icon: RiChromeFill
  },
  chromium: {
    label: "Chromium",
    icon: RiChromeFill
  },
  edge: {
    label: "Edge",
    icon: RiEdgeNewFill
  },
  firefox: {
    label: "Firefox",
    icon: RiFirefoxBrowserFill
  },
  opera: {
    label: "Opera",
    icon: RiOperaFill
  },
  safari: {
    label: "Safari",
    icon: RiSafariFill
  }
};

const SYSTEMS: Readonly<Record<string, Platform>> = {
  windows: {
    label: "Windows",
    icon: RiWindowsFill
  },
  macos: {
    label: "macOS",
    icon: RiAppleFill
  },
  linux: {
    label: "Linux",
    icon: RiUbuntuFill
  },
  android: {
    label: "Android",
    icon: RiAndroidFill
  }
};

const titleCase = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

export const browserPlatform = (browser: string | null): Platform | null => {
  if (!browser) return null;

  return (
    BROWSERS[browser.toLowerCase()] ?? {
      label: titleCase(browser),
      icon: RiGlobalFill
    }
  );
};

export const systemPlatform = (os: string | null): Platform | null => {
  if (!os || os.toLowerCase() === "unknown") return null;

  return (
    SYSTEMS[os.toLowerCase()] ?? {
      label: titleCase(os),
      icon: RiComputerFill
    }
  );
};