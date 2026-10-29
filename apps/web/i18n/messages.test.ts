import { describe, expect, it, vi } from "vitest";
import { SUPPORTED_LOCALES } from "@nowly/locales";
import { loadCatalog, mergeMessages } from "@nowly/locales/messages";
import { loadWebMessages } from "@nowly/locales/messages/web";
import { loadDocsMessages } from "@nowly/locales/messages/docs";
import shared from "@nowly/locales/catalogs/shared";
import web from "@nowly/locales/catalogs/web";
import docs from "@nowly/locales/catalogs/docs";

const messageKeys = (tree: Record<string, unknown>, prefix = ""): string[] =>
  Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === "object" && !Array.isArray(value) ? messageKeys(value as Record<string, unknown>, path) : [path];
  });

describe("shared translation catalogs", () => {
  it.each(SUPPORTED_LOCALES)("shares common namespaces without mixing app catalogs in %s", async (locale) => {
    const [webMessages, docsMessages, sharedCatalog, webCatalog, docsCatalog] = await Promise.all([
      loadWebMessages(locale),
      loadDocsMessages(locale),
      shared[locale](),
      web[locale](),
      docs[locale]()
    ]);

    for (const namespace of Object.keys(sharedCatalog.default)) {
      expect(webCatalog.default).not.toHaveProperty(namespace);
      expect(docsCatalog.default).not.toHaveProperty(namespace);
      expect(webMessages[namespace]).toEqual(docsMessages[namespace]);
    }

    expect(webMessages).toHaveProperty("libraryPage");
    expect(webMessages).not.toHaveProperty("docsUi");
    expect(docsMessages).toHaveProperty("docsUi");
    expect(docsMessages).not.toHaveProperty("libraryPage");

    for (const catalog of [shared, web, docs]) {
      const [translated, english] = await Promise.all([
        catalog[locale](),
        catalog["en-US"]()
      ]);
      expect(messageKeys(translated.default).sort()).toEqual(messageKeys(english.default).sort());
    }
  });

  it("only imports the requested locale and English fallback", async () => {
    const english = vi.fn(async () => ({
      default: {
        title: "Title",
        description: "Description"
      }
    }));
    const french = vi.fn(async () => ({
      default: { title: "Titre" }
    }));
    const unused = vi.fn(async () => ({
      default: {}
    }));
    const catalogs: Parameters<typeof loadCatalog>[0] = {
      "en-US": english,
      "fr-FR": french,
      "es-ES": unused,
      "de-DE": unused,
      "pt-BR": unused,
      "pl-PL": unused,
      "ja-JP": unused,
      "ko-KR": unused,
      "tr-TR": unused,
      "ms-MY": unused,
      "el-GR": unused
    };

    expect(await loadCatalog(catalogs, "fr-FR")).toEqual({
      title: "Titre",
      description: "Description"
    });
    expect(english).toHaveBeenCalledOnce();
    expect(french).toHaveBeenCalledOnce();
    expect(unused).not.toHaveBeenCalled();
  });

  it("falls back recursively without mutating catalogs or merging arrays by index", () => {
    const english = {
      navbar: {
        docs: "Documentation",
        library: "Library"
      },
      keywords: ["one", "two"]
    };
    const translated = {
      navbar: { docs: "Dokumentation" },
      keywords: ["eins"]
    };

    expect(mergeMessages(english, translated)).toEqual({
      navbar: {
        docs: "Dokumentation",
        library: "Library"
      },
      keywords: ["eins"]
    });
    expect(english.navbar.docs).toBe("Documentation");
    expect(english.keywords).toEqual(["one", "two"]);
  });
});