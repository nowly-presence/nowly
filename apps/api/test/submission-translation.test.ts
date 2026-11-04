import { maskTokens, restoreTranslation, shorten, translateDefinition } from "@/features/presence-submissions/submission-translation";
import { creatorDefinition, normalizeDraft, validateDraft } from "@nowly/presence-creator";
import { sampleCreatorDraft } from "@nowly/presence-creator/creator-fixtures";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const english = () => ({
  ...creatorDefinition(sampleCreatorDraft()),
  translationMode: "auto" as const,
  locales: ["en-US" as const]
});

type Item = {
  key: string;
  text: string;
  max: number;
};

const requests: Array<{
  url: string;
  system: string;
  items: Item[];
}> = [];

const fakeModel = (translate: (item: Item, locale: string) => string | null) =>
  vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    const system = String(body.messages[0].content);
    const items: Item[] = JSON.parse(body.messages[1].content);
    const locale = /to (\w\w-\w\w)/.exec(system)?.[1] ?? "";
    requests.push({
      url: String(input),
      system,
      items
    });
    const translated = items.flatMap((item) => {
      const text = translate(item, locale);
      return text === null
        ? []
        : [
            {
              key: item.key,
              text
            }
          ];
    });
    return new Response(
      JSON.stringify({
        success: true,
        result: {
          response: { items: translated }
        }
      }),
      { status: 200 }
    );
  });

beforeEach(() => {
  requests.length = 0;
  vi.stubEnv("WORKERS_AI_API_TOKEN", "token");
  vi.stubEnv("WORKERS_AI_ACCOUNT_ID", "account");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("translation helpers", () => {
  it("masks tokens and restores them in any order", () => {
    const { masked, tokens } = maskTokens("Watching {title} by {channel}");
    expect(masked).toBe("Watching {0} by {1}");
    const source = {
      key: "x",
      text: "Watching {title} by {channel}",
      max: 128
    };
    expect(restoreTranslation(source, "{1} : {0}", tokens)).toBe("{channel} : {title}");
  });

  it("keeps the base text when a token is lost, renamed or left masked", () => {
    const source = {
      key: "x",
      text: "Watching {title}",
      max: 128
    };
    expect(restoreTranslation(source, "Regarde une vidéo", ["{title}"])).toBe("Watching {title}");
    expect(restoreTranslation(source, "Regarde {titre}", ["{title}"])).toBe("Watching {title}");
    expect(restoreTranslation(source, "Regarde {3}", ["{title}"])).toBe("Watching {title}");
    expect(restoreTranslation(source, "  ", ["{title}"])).toBe("Watching {title}");
  });

  it("shortens on a word boundary", () => {
    expect(shorten("Voir la vidéo maintenant", 12)).toBe("Voir la");
    expect(shorten("Court", 32)).toBe("Court");
  });
});

describe("translateDefinition", () => {
  it("translates every text into the repository languages and switches to manual mode", async () => {
    vi.stubGlobal(
      "fetch",
      fakeModel((item, locale) => `[${locale}] ${item.text}`)
    );
    const translated = await translateDefinition(english());

    expect(requests.map((request) => request.url)).toEqual([
      "https://api.cloudflare.com/client/v4/accounts/account/ai/run/@cf/google/gemma-4-26b-a4b-it",
      "https://api.cloudflare.com/client/v4/accounts/account/ai/run/@cf/google/gemma-4-26b-a4b-it"
    ]);
    expect(requests[0].items.find((item) => item.key.endsWith(".details"))?.text).toBe("Watching {0}");
    expect(translated).toMatchObject({
      translationMode: "manual",
      locales: ["en-US", "fr-FR", "es-ES"]
    });
    expect(translated.pages[0].details).toEqual({
      "en-US": "Watching {title}",
      "fr-FR": "[fr-FR] Watching {title}",
      "es-ES": "[es-ES] Watching {title}"
    });
    expect(translated.pages[0].buttons[0].label["es-ES"]).toBe("[es-ES] Watch video");
    expect(
      validateDraft(
        normalizeDraft({
          ...translated,
          assets: {
            thumbnail: "t",
            logo: "l",
            icon: "i",
            iconTransparent: true,
            thumbnailRightsConfirmed: true
          }
        })
      )
    ).toEqual([]);
  });

  it("falls back to the base text for missing or broken items and fails on invalid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      fakeModel((item) => (item.key === "description" ? null : item.key.endsWith(".state") ? "par la chaîne" : `ok ${item.text}`))
    );
    const translated = await translateDefinition(english());
    expect(translated.description["fr-FR"]).toBe(english().description["en-US"]);
    expect(translated.pages[0].state["fr-FR"]).toBe("by {channel}");

    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              result: { response: "not json" }
            }),
            { status: 200 }
          )
      )
    );
    await expect(translateDefinition(english())).rejects.toThrow("not valid JSON");

    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              result: {
                choices: [
                  {
                    message: { content: '```json\n{"items":[{"key":"description","text":"Affichez la vidéo"}]}\n```' }
                  }
                ]
              }
            }),
            { status: 200 }
          )
      )
    );
    expect((await translateDefinition(english())).description["fr-FR"]).toBe("Affichez la vidéo");
  });
});