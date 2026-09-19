import type { NativeStatus } from "@/lib/messages";
import type { CurrentActivity, InstalledPresences, UserScriptsStatus } from "@/shared/types";

export const YOUTUBE_PRESENCE_SLUG = "youtube";
export const YOUTUBE_TEST_URL = "https://youtube.com";

export type DiagnosticSnapshot = {
  extensionInstalled: boolean;
  userScriptsActive: boolean;
  hostDetected: boolean;
  discordConnected: boolean;
  presenceInstalled: boolean;
  youtubePresenceInstalled: boolean;
  activityDetected: boolean;
  youtubeActivityDetected: boolean;
  installedPresenceCount: number;
  currentPresenceName?: string;
};

export const isHostDetected = (nativeStatus: NativeStatus): boolean =>
  Boolean(nativeStatus.connected || nativeStatus.discordConnected);

export const isHostChecking = (nativeStatus: NativeStatus): boolean =>
  nativeStatus.status === "connecting" || nativeStatus.status === "unknown";

export const buildDiagnosticSnapshot = ({
  activity,
  nativeStatus,
  presences,
  userScripts,
}: {
  activity: CurrentActivity | null;
  nativeStatus: NativeStatus;
  presences: InstalledPresences;
  userScripts: UserScriptsStatus;
}): DiagnosticSnapshot => {
  const installedPresences = Object.values(presences).filter((presence) => (
    presence?.metadata?.slug && presence.metadata.name
  ));
  const currentPresence = activity ? presences[activity.slug] : undefined;

  return {
    extensionInstalled: true,
    userScriptsActive: userScripts.enabled,
    hostDetected: isHostDetected(nativeStatus),
    discordConnected: Boolean(nativeStatus.discordConnected),
    presenceInstalled: installedPresences.length > 0,
    youtubePresenceInstalled: Boolean(presences[YOUTUBE_PRESENCE_SLUG]),
    activityDetected: Boolean(activity),
    youtubeActivityDetected: activity?.slug === YOUTUBE_PRESENCE_SLUG,
    installedPresenceCount: installedPresences.length,
    currentPresenceName: currentPresence?.metadata.name ?? activity?.slug,
  };
};