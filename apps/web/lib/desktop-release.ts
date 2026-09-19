import { CDN_INSTALLER_BASE_URL, DESKTOP_LATEST_MANIFEST_URL } from "@/lib/constants";

export type DesktopPlatform = "windows" | "macos" | "linux";

export type DesktopRelease = {
  version: string | null
  windows: { installer: string; portable: string }
  macos: { dmg: string; archive: string | null }
  linux: { archive: string; deb: string | null }
};

const fallbackRelease = (): DesktopRelease => ({
  version: null,
  windows: {
    installer: `${CDN_INSTALLER_BASE_URL}/nowly-setup.exe`,
    portable: `${CDN_INSTALLER_BASE_URL}/nowly-windows.zip`,
  },
  macos: {
    dmg: `${CDN_INSTALLER_BASE_URL}/nowly-macos.dmg`,
    archive: null,
  },
  linux: {
    archive: `${CDN_INSTALLER_BASE_URL}/nowly-linux.tar.gz`,
    deb: null,
  },
});

type ManifestArtifact = { url?: unknown };
type Manifest = {
  version?: unknown
  windows?: { installer?: ManifestArtifact; portable?: ManifestArtifact }
  macos?: { dmg?: ManifestArtifact; archive?: ManifestArtifact }
  linux?: { archive?: ManifestArtifact; deb?: ManifestArtifact }
};

const artifactUrl = (value: ManifestArtifact | undefined, fallback: string): string =>
  typeof value?.url === "string" && value.url.length > 0 ? value.url : fallback;

export const getDesktopRelease = async (): Promise<DesktopRelease> => {
  const fallback = fallbackRelease();

  try {
    const response = await fetch(DESKTOP_LATEST_MANIFEST_URL, { next: { revalidate: 60 } });
    if (!response.ok) return fallback;

    const manifest = (await response.json()) as Manifest;
    return {
      version: typeof manifest.version === "string" && manifest.version.trim()
        ? manifest.version.trim()
        : null,
      windows: {
        installer: artifactUrl(manifest.windows?.installer, fallback.windows.installer),
        portable: artifactUrl(manifest.windows?.portable, fallback.windows.portable),
      },
      macos: {
        dmg: artifactUrl(manifest.macos?.dmg, fallback.macos.dmg),
        archive: typeof manifest.macos?.archive?.url === "string" && manifest.macos.archive.url.length > 0
          ? manifest.macos.archive.url
          : null,
      },
      linux: {
        archive: artifactUrl(manifest.linux?.archive, fallback.linux.archive),
        deb: typeof manifest.linux?.deb?.url === "string" && manifest.linux.deb.url.length > 0
          ? manifest.linux.deb.url
          : null,
      },
    };
  } catch {
    return fallback;
  }
};
