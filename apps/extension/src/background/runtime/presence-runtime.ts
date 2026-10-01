export const USER_SCRIPT_MESSAGE_SOURCE = "NOWLY_PRESENCE"

export const createPresenceRuntime = (
  slug: string,
  name: string,
  bundle: string,
  settings: Record<string, unknown> = {},
  strings: Record<string, string> = {},
  apiBaseUrl = "https://api.nowly.me",
  cdnBaseUrl?: string,
  options: { mode?: "main" | "iframe"; iframeRegExp?: string } = {},
): string => {
  const mode = options.mode ?? "main"
  const iframeRegExp = options.iframeRegExp ?? ""
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
  const NOWLY_MODE = ${JSON.stringify(mode)};
  const NOWLY_IFRAME_REGEXP = ${JSON.stringify(iframeRegExp)};
  const listeners = new Map();
  const instances = [];
  const iframeListeners = new Map();
  const iframeInstances = [];
  const storage = new Map();
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
  const postActivity = (data) => {
    const localized = localizeActivity(data);
    post("ACTIVITY_UPDATE", {
      activity: {
        ...localized,
        name: localized.name || localized.appName || NOWLY_NAME,
      },
    });
  };

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

      postActivity(data);
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

    getSetting(key) {
      return Promise.resolve(key == null ? undefined : ctxSettings[key]);
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
      postActivity(data);
    },
    clearActivity() {
      post("CLEAR_ACTIVITY");
    },
    storage,
    settings: ctxSettings,
  };

  if (NOWLY_MODE === "iframe") {
    if (window.top === window) return;

    let matchesIframe = false;
    try {
      matchesIframe = Boolean(NOWLY_IFRAME_REGEXP) && new RegExp(NOWLY_IFRAME_REGEXP).test(window.location.href);
    } catch {
      matchesIframe = false;
    }
    if (!matchesIframe) return;

    class IFrame {
      constructor() {
        iframeInstances.push(this);
      }

      on(eventName, listener) {
        if (eventName !== "UpdateData") return;
        const callbacks = iframeListeners.get(this) ?? [];
        callbacks.push(listener);
        iframeListeners.set(this, callbacks);
      }

      send(data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) return;
        try {
          window.top.postMessage({
            source: "NOWLY_IFRAME",
            type: "DATA",
            slug: NOWLY_SLUG,
            frameUrl: window.location.href,
            payload: data,
          }, "*");
        } catch {
        }
      }

      getUrl() {
        return Promise.resolve(window.location.href);
      }
    }

    globalThis.iFrame = IFrame;

    try {
      ${bundle}

      const factory = typeof __PRESENCE__ !== "undefined" && __PRESENCE__?.default
        ? __PRESENCE__.default
        : undefined;
      factory?.init?.(ctx);

      const tick = () => {
        try {
          factory?.tick?.(ctx);
          for (const instance of iframeInstances) {
            const callbacks = iframeListeners.get(instance) ?? [];
            for (const callback of callbacks) {
              Promise.resolve(callback()).catch(() => {});
            }
          }
        } catch {
        }
      };

      tick();
      const timer = setInterval(tick, 5000);
      let tickDebounce;
      const scheduleTick = () => {
        clearTimeout(tickDebounce);
        tickDebounce = setTimeout(tick, 250);
      };
      const boundMedia = new WeakSet();
      const bindMedia = (element) => {
        if (boundMedia.has(element)) return;
        boundMedia.add(element);
        element.addEventListener("play", scheduleTick);
        element.addEventListener("pause", scheduleTick);
        element.addEventListener("ended", scheduleTick);
        element.addEventListener("seeked", scheduleTick);
        element.addEventListener("timeupdate", scheduleTick);
      };
      const scanMedia = () => document.querySelectorAll("audio, video").forEach(bindMedia);
      const observeDocument = () => {
        scanMedia();
        observer.observe(document.documentElement, { childList: true, subtree: true });
      };
      const observer = new MutationObserver(() => {
        scanMedia();
        scheduleTick();
      });
      if (document.documentElement) observeDocument();
      else window.addEventListener("DOMContentLoaded", observeDocument, { once: true });
      window.addEventListener("popstate", scheduleTick);
      window.addEventListener("hashchange", scheduleTick);
      window.addEventListener("pagehide", () => {
        clearInterval(timer);
        clearTimeout(tickDebounce);
        observer.disconnect();
        factory?.destroy?.();
      });
    } catch {
    }
    return;
  }

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
    let mediaDebounce;
    let timeupdateDebounce;
    const scheduleTick = () => {
      clearTimeout(mediaDebounce);
      mediaDebounce = setTimeout(tick, 250);
    };
    const scheduleTimeupdateTick = () => {
      clearTimeout(timeupdateDebounce);
      timeupdateDebounce = setTimeout(tick, 1000);
    };
    const boundMedia = new WeakSet();
    const bindMedia = (el) => {
      if (boundMedia.has(el)) return;
      boundMedia.add(el);
      el.addEventListener("play", scheduleTick);
      el.addEventListener("pause", scheduleTick);
      el.addEventListener("ended", scheduleTick);
      el.addEventListener("seeked", scheduleTick);
      el.addEventListener("timeupdate", scheduleTimeupdateTick);
    };
    const scanMedia = () => {
      document.querySelectorAll("audio, video").forEach(bindMedia);
    };
    scanMedia();
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") tick();
    });
    window.addEventListener("popstate", scheduleTick);
    window.addEventListener("hashchange", scheduleTick);
    const observer = new MutationObserver(() => {
      scanMedia();
      scheduleTick();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => {
      clearInterval(timer);
      clearTimeout(mediaDebounce);
      clearTimeout(timeupdateDebounce);
      observer.disconnect();
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
    window.addEventListener("message", (event) => {
      if (NOWLY_MODE !== "main") return;
      if (!NOWLY_IFRAME_REGEXP) return;
      if (event.source === window) return;
      const message = event.data;
      if (message?.source !== "NOWLY_IFRAME" || message.type !== "DATA" || message.slug !== NOWLY_SLUG) return;
      if (!message.payload || typeof message.payload !== "object" || Array.isArray(message.payload)) return;

      if (NOWLY_IFRAME_REGEXP) {
        try {
          if (typeof message.frameUrl !== "string" || !new RegExp(NOWLY_IFRAME_REGEXP).test(message.frameUrl)) return;
        } catch {
          return;
        }
      }

      for (const instance of instances) {
        const eventListeners = listeners.get(instance);
        const callbacks = eventListeners?.get("iFrameData") ?? [];
        for (const callback of callbacks) {
          Promise.resolve(callback(message.payload)).catch((error) => {
            post("DEBUG", {
              stage: "presence-error",
              message: error instanceof Error ? error.message : "iFrameData failed",
            });
          });
        }
      }
    });

  } catch (error) {
    post("DEBUG", {
      stage: "presence-error",
      message: error instanceof Error ? error.message : "presence bundle failed",
    });
  }
})();
`
}
