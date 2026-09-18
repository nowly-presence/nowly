/// <reference types="vite/client" />

declare module "@tabler/icons-react/dist/esm/icons/*.mjs" {
  import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

  const Icon: ForwardRefExoticComponent<
    SVGProps<SVGSVGElement> & {
      size?: number | string;
      stroke?: number | string;
      title?: string;
    } & RefAttributes<SVGSVGElement>
  >;

  export default Icon;
}

interface ImportMetaEnv {
  readonly BROWSER: "chrome" | "firefox"
  readonly VITE_NOWLY_CHANNEL: "stable" | "canary"
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "@/generated/bundled-presences" {
  import type { PresenceRelease } from "@/shared/types"

  export interface BundledPresence {
    slug: string
    release: PresenceRelease
  }

  export const BUNDLED_PRESENCES: BundledPresence[]
}

declare module "@/generated/bundled-presence-slugs" {
  export const BUNDLED_PRESENCE_SLUGS: string[]
}