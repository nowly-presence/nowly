import type { ReactElement } from "react";
import { AppleIcon, LinuxIcon, WindowsIcon } from "@/lib/icons";

export type Platform = {
  name: string;
  icon: ReactElement;
  downloadLink?: string;
};

const CDN_BASE = "https://cdn.nowly.me/installer";

export const platforms: Platform[] = [
  {
    name: "Windows",
    icon: <WindowsIcon />,
    downloadLink: `${CDN_BASE}/nowly-setup.exe`,
  },
  {
    name: "macOS",
    icon: <AppleIcon />,
    downloadLink: `${CDN_BASE}/nowly-macos.dmg`,
  },
  {
    name: "Linux",
    icon: <LinuxIcon />,
    downloadLink: `${CDN_BASE}/nowly-linux.tar.gz`,
  },
];
