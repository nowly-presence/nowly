import { describe, expect, it } from "vitest";
import { configuredPresenceLocale, defaultPresenceLocale } from "@/shared/presence-language";

const THREE = {
  "en-US": {},
  "fr-FR": {},
  "es-ES": {}
};

describe("presence language resolution", () => {
  it("determines default presence locale following UI language with en-US fallback", () => {
    expect(defaultPresenceLocale(THREE, "fr")).toBe("fr-FR");
    expect(defaultPresenceLocale(THREE, "de")).toBe("en-US");
    expect(defaultPresenceLocale(undefined, "fr")).toBe("en-US");
  });

  it("determines configured locale with precedence: global setting -> per-presence override -> UI language", () => {
    // Global override
    expect(configuredPresenceLocale({ presenceLanguage: "es-ES" }, "youtube", THREE, "fr")).toBe("es-ES");

    // Per-presence override
    expect(
      configuredPresenceLocale(
        {
          presenceLanguage: "per-presence",
          presenceLanguages: { youtube: "en-US" }
        },
        "youtube",
        THREE,
        "fr"
      )
    ).toBe("en-US");

    // Default per-presence fallback to interface language
    expect(configuredPresenceLocale({ presenceLanguage: "per-presence" }, "youtube", THREE, "fr")).toBe("fr-FR");
    expect(configuredPresenceLocale({}, "youtube", THREE, "fr")).toBe("fr-FR");
  });
});