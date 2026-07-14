export const USER_SCRIPT_MESSAGE_SOURCE = "NOWLY_PRESENCE";

export const createPresenceRuntime = (
  slug: string,
  name: string,
  bundle: string,
  settings: Record<string, unknown> = {},
  strings: Record<string, string> = {},
  apiBaseUrl = "https://api.nowly.me",
  cdnBaseUrl?: string
): string => {
  const assetsBase = cdnBaseUrl
    ? `${cdnBaseUrl.replace(/\/+$/, "")}/presences/${slug}/assets`
    : chrome.runtime.getURL(`presences/${slug}/assets`)
  return `
(() => {
  "use strict";

  const NOWLY_SLUG = ${JSON.stringify(slug)};
  const NOWLY_NAME = ${JSON.stringify(name)};
  const NOWLY_SOURCE = ${JSON.stringify(USER_SCRIPT_MESSAGE_SOURCE)};
  const NOWLY_SETTINGS = ${JSON.stringify(settings)};
  const NOWLY_STRINGS = ${JSON.stringify(strings)};
  const NOWLY_ASSETS_BASE = ${JSON.stringify(assetsBase)};
  const listeners = new Map();
  const instances = [];
  const storage = new Map();
  // Mutable settings object: extension-injected values take priority, missing keys fall back to presence defaults
  const ctxSettings = Object.assign({}, NOWLY_SETTINGS);
  const ctxStrings = Object.assign({}, NOWLY_STRINGS);
  const localizeText = (value) => {
    if (typeof value !== "string") return value;
    const key = ({ Browsing: "browsing", Searching: "searching", Watching: "watching", Playing: "playing", Paused: "paused" })[value];
    return key ? ctxStrings[key] ?? value : value;
  };
  const localizeActivity = (data) => ({
    ...data,
    details: localizeText(data.details),
    state: localizeText(data.state),
    largeImageText: localizeText(data.largeImageText),
    smallImageText: localizeText(data.smallImageText),
  });

  const post = (type, payload = {}) => {
    window.postMessage({
      source: NOWLY_SOURCE,
      type,
      payload: { slug: NOWLY_SLUG, ...payload },
    }, "*");
  };

  class Presence {
    constructor() {
      instances.push(this);
    }

    static Settings(definitions) {
      if (typeof __PRESENCE_SETTINGS__ !== "undefined") {
        __PRESENCE_SETTINGS__ = definitions;
      }
      if (typeof definitions !== "object" || definitions === null) return ctxSettings;
      // Apply defaults only for keys the extension hasn't explicitly set
      for (const [key, value] of Object.entries(definitions)) {
        if (!(key in ctxSettings)) {
          ctxSettings[key] = typeof value === "object" && value !== null && "default" in value
            ? value.default
            : value;
        }
      }
      return ctxSettings;
    }

    static Assets(assets) {
      if (typeof assets !== "object" || assets === null) return {};
      const resolved = {};
      for (const [key, value] of Object.entries(assets)) {
        const cleanPath = String(value).replace(/^\\//, "");
        resolved[key] = NOWLY_ASSETS_BASE + "/" + cleanPath;
      }
      return resolved;
    }

    on(eventName, listener) {
      const eventListeners = listeners.get(this) ?? new Map();
      const callbacks = eventListeners.get(eventName) ?? [];
      callbacks.push(listener);
      eventListeners.set(eventName, callbacks);
      listeners.set(this, eventListeners);
    }

    setActivity(data) {
      if (!data) {
        this.clearActivity();
        return Promise.resolve();
      }

      post("ACTIVITY_UPDATE", { activity: { name: NOWLY_NAME, ...localizeActivity(data) } });
      return Promise.resolve();
    }

    clearActivity() {
      post("CLEAR_ACTIVITY");
    }

    getStrings() {
      return Promise.resolve(ctxStrings);
    }

    formatString(template, params = {}) {
      return String(template).replace(/\{([^{}]+)\}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match
      );
    }

    getSetting() {
      return Promise.resolve(undefined);
    }

    info(message) {
      post("DEBUG", { stage: "presence", message: String(message) });
    }

    error(message) {
      post("DEBUG", { stage: "presence-error", message: String(message) });
    }
  }

  globalThis.Presence = Presence;
  const Assets = globalThis.Assets = {
    Logo: NOWLY_ASSETS_BASE + "/logo.png",
    Icon: NOWLY_ASSETS_BASE + "/icon.png",
    Thumbnail: NOWLY_ASSETS_BASE + "/thumbnail.jpg",
  };

  const ctx = {
    setActivity(data) {
      post("ACTIVITY_UPDATE", { activity: { name: NOWLY_NAME, ...localizeActivity(data) } });
    },
    clearActivity() {
      post("CLEAR_ACTIVITY");
    },
    storage,
    settings: ctxSettings,
  };

  try {
    ${bundle}

    const factory = typeof __PRESENCE__ !== "undefined" && __PRESENCE__?.default
      ? __PRESENCE__.default
      : undefined;

    factory?.init?.(ctx);

    const tick = () => {
      try {
        factory?.tick?.(ctx);

        for (const instance of instances) {
          const eventListeners = listeners.get(instance);
          const callbacks = eventListeners?.get("UpdateData") ?? [];
          for (const callback of callbacks) {
            Promise.resolve(callback(ctx)).catch((error) => {
              post("DEBUG", {
                stage: "presence-error",
                message: error instanceof Error ? error.message : "UpdateData failed",
              });
            });
          }
        }
      } catch (error) {
        post("DEBUG", {
          stage: "presence-error",
          message: error instanceof Error ? error.message : "presence tick failed",
        });
      }
    };

    tick();
    const timer = setInterval(tick, 5000);
    window.addEventListener("pagehide", () => {
      clearInterval(timer);
      factory?.destroy?.();
      post("CLEAR_ACTIVITY");
    });

    window.addEventListener("message", (event) => {
      if (event.data?.source !== "NOWLY_HOST") return;
      if (event.data?.type !== "SETTINGS_UPDATED") return;
      if (event.data?.slug !== NOWLY_SLUG) return;
      Object.assign(ctx.settings, event.data.settings);
      if (event.data.strings) {
        for (const key of Object.keys(ctxStrings)) delete ctxStrings[key];
        Object.assign(ctxStrings, event.data.strings);
      }
      tick();
    });
  } catch (error) {
    post("DEBUG", {
      stage: "presence-error",
      message: error instanceof Error ? error.message : "presence bundle failed",
    });
  }
})();
`;
}
