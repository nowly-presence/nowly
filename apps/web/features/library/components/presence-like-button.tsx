"use client";

import { requestExtension, type ExtensionDeviceInfo } from "@/lib/extension-bridge";
import { presenceApiBaseUrl } from "@/lib/presence-api";
import { Button } from "@nowly/ui";
import { RiHeartFill, RiHeartLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type PresenceLikeButtonProps = {
  slug: string
  initialCount: number
  disabled: boolean
};

export const PresenceLikeButton = ({ slug, initialCount, disabled }: PresenceLikeButtonProps) => {
  const t = useTranslations("presencePage");
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [device, setDevice] = useState<ExtensionDeviceInfo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (disabled) {
      setDevice(null);
      setReady(false);
      return;
    }

    let cancelled = false;
    void requestExtension<ExtensionDeviceInfo>("GET_DEVICE_INFO")
      .then((info) => {
        if (cancelled || !info?.deviceId) return;
        setDevice(info);
        return fetch(`${presenceApiBaseUrl()}/presences/${encodeURIComponent(slug)}/like?deviceId=${encodeURIComponent(info.deviceId)}`)
          .then((response) => (response.ok ? response.json() : null))
          .then((data: { liked?: boolean; count?: number } | null) => {
            if (cancelled || !data) return;
            if (typeof data.liked === "boolean") setLiked(data.liked);
            if (typeof data.count === "number") setCount(data.count);
          });
      })
      .catch(() => {
        // Extension not detected or bridge timed out - stay disabled.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [disabled, slug]);

  const onToggle = async (): Promise<void> => {
    if (!device?.deviceId) return;
    const { deviceId, deviceToken } = device;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((current) => current + (nextLiked ? 1 : -1));

    const url = nextLiked
      ? `${presenceApiBaseUrl()}/presences/${encodeURIComponent(slug)}/like`
      : `${presenceApiBaseUrl()}/presences/${encodeURIComponent(slug)}/like?deviceId=${encodeURIComponent(deviceId)}`;

    try {
      const response = await fetch(url, {
        method: nextLiked ? "POST" : "DELETE",
        headers: {
          ...(nextLiked ? { "Content-Type": "application/json" } : {}),
          ...(deviceToken ? { "X-Device-Token": deviceToken } : {}),
        },
        body: nextLiked ? JSON.stringify({ deviceId }) : undefined,
      });
      if (!response.ok) throw new Error("like request failed");
      const data = (await response.json()) as { count?: number };
      if (typeof data.count === "number") setCount(data.count);
    } catch {
      setLiked(!nextLiked);
      setCount((current) => current - (nextLiked ? 1 : -1));
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={disabled || !ready || !device?.deviceId}
      onClick={() => void onToggle()}
      aria-pressed={liked}
      aria-label={liked ? t("unlike") : t("like")}
    >
      {liked ? <RiHeartFill data-icon="inline-start" className="text-destructive" /> : <RiHeartLine data-icon="inline-start" />}
      {count}
    </Button>
  );
};
