import { clearProductTelemetry, trackProduct } from "@/background/telemetry";
import { clearRuntimeLogs, getRuntimeLogs } from "@/background/runtime-logs";
import type { Handler } from "@/background/router/router";
import { getAnalyticsConsent, setAnalyticsConsent } from "@/background/storage/device.store";

export const handleGetAnalyticsConsent: Handler<"GET_ANALYTICS_CONSENT"> = async () => ({ granted: await getAnalyticsConsent() });

export const handleSetAnalyticsConsent: Handler<"SET_ANALYTICS_CONSENT"> = async ({ granted }) => {
  const next = await setAnalyticsConsent(granted === true);
  if (!next) await clearProductTelemetry();
  if (next) void trackProduct(
    {
      name: "extension_active",
      source: "extension",
      data: {}
    },
    { daily: "panel" }
  );
  return {
    granted: next
  };
};

export const handleRecordExtensionActive: Handler<"RECORD_EXTENSION_ACTIVE"> = () => {
  void trackProduct(
    {
      name: "extension_active",
      source: "extension",
      data: {}
    },
    { daily: "panel" }
  );
  return {
    ok: true
  };
};

export const handleGetRuntimeLogs: Handler<"GET_RUNTIME_LOGS"> = () => getRuntimeLogs();

export const handleClearRuntimeLogs: Handler<"CLEAR_RUNTIME_LOGS"> = () => {
  clearRuntimeLogs();
  return {
    ok: true
  };
};