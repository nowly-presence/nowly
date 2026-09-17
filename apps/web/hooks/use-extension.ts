"use client";

import {
  getExtensionDetected,
  isDevPresenceVersion,
  normalizePresenceVersion,
  parseInstalledMap,
  requestExtension,
  subscribeExtensionDetected,
  type ExtensionDiagnostic,
  type InstalledPresenceInfo,
} from "@/lib/extension-bridge";
import { fetchPresenceRelease } from "@/lib/presence-api";
import { useCallback, useEffect, useState } from "react";

const isMobileBrowser = (): boolean =>
  /android|iphone|ipad|ipod/i.test(navigator.userAgent);

export const useExtension = () => {
  const [detected, setDetected] = useState<boolean | null>(() => getExtensionDetected());
  const [diagnostic, setDiagnostic] = useState<ExtensionDiagnostic | null>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => subscribeExtensionDetected(setDetected), []);

  useEffect(() => {
    setMobile(isMobileBrowser());
  }, []);

  useEffect(() => {
    if (!detected) {
      setDiagnostic(null);
      return;
    }

    let cancelled = false;
    void requestExtension<ExtensionDiagnostic>("GET_DIAGNOSTIC")
      .then((payload) => {
        if (!cancelled && payload && typeof payload === "object") {
          setDiagnostic(payload);
        }
      })
      .catch(() => {
        if (!cancelled) setDiagnostic(null);
      });

    return () => {
      cancelled = true;
    };
  }, [detected]);

  return {
    detected,
    diagnostic,
    mobile,
  };
};

export const usePresenceExtension = (slug: string, latestVersion?: string | null) => {
  const { detected, diagnostic, mobile } = useExtension();
  const [installed, setInstalled] = useState<InstalledPresenceInfo | null>(null);
  const [catalogReady, setCatalogReady] = useState(false);
  const [bridgeBlocked, setBridgeBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const refreshInstalled = useCallback(async (): Promise<InstalledPresenceInfo | null> => {
    const map = parseInstalledMap(await requestExtension<unknown>("GET_INSTALLED", undefined, 4000));
    const next = map[slug] ?? null;
    setInstalled(next);
    setBridgeBlocked(false);
    return next;
  }, [slug]);

  useEffect(() => {
    if (detected === null) {
      setCatalogReady(false);
      setBridgeBlocked(false);
      return;
    }

    if (!detected) {
      setInstalled(null);
      setCatalogReady(true);
      setBridgeBlocked(false);
      return;
    }

    let cancelled = false;
    setCatalogReady(false);
    void refreshInstalled()
      .then(() => {
        if (!cancelled) setCatalogReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setInstalled(null);
          setBridgeBlocked(true);
          setCatalogReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [detected, refreshInstalled]);

  const installedVersion = installed?.version ?? null;
  const catalogVersion = normalizePresenceVersion(latestVersion);
  const isInstalled = installed !== null;
  const needsUpdate =
    Boolean(detected) &&
    !bridgeBlocked &&
    isInstalled &&
    Boolean(catalogVersion) &&
    Boolean(installedVersion) &&
    installedVersion !== catalogVersion &&
    !isDevPresenceVersion(installedVersion);

  const install = useCallback(async (): Promise<"ok" | "queued" | "blocked" | false> => {
    if (!detected || mobile || bridgeBlocked) return bridgeBlocked ? "blocked" : false;
    setBusy(true);
    try {
      const release = await fetchPresenceRelease(slug);
      const result = await requestExtension<{ ok?: boolean; queued?: boolean; error?: string }>(
        needsUpdate ? "UPDATE_PRESENCE" : "INSTALL_PRESENCE",
        { slug, release },
      );
      if (result?.ok === true) {
        const installedRelease = release as { version?: unknown };
        const version = normalizePresenceVersion(installedRelease.version);
        setInstalled({ version });
      }
      await refreshInstalled();
      if (result?.queued === true) return "queued";
      if (result?.ok === true) return "ok";
      return false;
    } catch (error) {
      if (error instanceof Error && error.message.includes("timed out")) return "blocked";
      return false;
    } finally {
      setBusy(false);
    }
  }, [bridgeBlocked, detected, mobile, needsUpdate, refreshInstalled, slug]);

  const uninstall = useCallback(async (): Promise<boolean> => {
    if (!detected || bridgeBlocked) return false;
    setBusy(true);
    try {
      const result = await requestExtension<{ ok?: boolean }>("UNINSTALL_PRESENCE", { slug });
      if (result?.ok === false) return false;
      setInstalled(null);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }, [bridgeBlocked, detected, slug]);

  return {
    bridgeBlocked,
    busy,
    catalogReady,
    detected,
    diagnostic,
    install,
    installedVersion,
    isInstalled,
    mobile,
    needsUpdate,
    uninstall,
  };
};
