import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type LegalPage = {
  "last-updated": string;
  intro?: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
};

const messagesDirectory = resolve(import.meta.dirname, "../../../../packages/locales/messages/web");
const locales = readdirSync(messagesDirectory).filter((file) => file.endsWith(".json"));
const canonical: Record<"privacy-page" | "tos-page", LegalPage> = JSON.parse(readFileSync(resolve(messagesDirectory, "en-US.json"), "utf8"));

describe.each(locales)("legal content in %s", (file) => {
  const messages: Record<"privacy-page" | "tos-page" | "legal-notice-page", LegalPage> = JSON.parse(readFileSync(resolve(messagesDirectory, file), "utf8"));
  const privacy = messages["privacy-page"];
  const terms = messages["tos-page"];

  it("keeps complete localized documents with unique titles and separate update dates", () => {
    expect(privacy.sections).toHaveLength(19);
    expect(terms.sections).toHaveLength(13);
    expect(privacy["last-updated"]).not.toBe(terms["last-updated"]);

    for (const page of [privacy, terms]) {
      expect(page["last-updated"]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Set(page.sections.map((section) => section.title)).size).toBe(page.sections.length);

      for (const section of page.sections) {
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.body.length).toBeGreaterThan(0);
      }
    }

    expect(privacy["last-updated"]).toBe(canonical["privacy-page"]["last-updated"]);
    expect(terms["last-updated"]).toBe(canonical["tos-page"]["last-updated"]);
  });

  it("discloses uploads and device metadata in every locale", () => {
    const upload = privacy.sections.find((section) => section.body.includes("Cloudflare R2"));
    expect(upload).toBeDefined();

    for (const detail of ["2.4.0", "UUID", "SHA-256", "MIME", "JSON", "HTTPS"]) expect(upload?.body).toContain(detail);

    expect(upload?.body).toMatch(/GDPR|RGPD|DSGVO|ΓΚΠΔ|RODO|GVKT/);
  });

  it("describes the MIT licence without obsolete non-commercial restrictions", () => {
    const licence = terms.sections[3].body;
    expect(licence).toContain("MIT");
    expect(licence).toContain('href="https://github.com/nowly-presence/nowly"');

    for (const page of [terms, messages["legal-notice-page"]]) {
      expect(JSON.stringify(page)).not.toMatch(/BUSL|Business Source License|Change Date|2028/);
    }
  });

  it("explains retention, caches, authenticated erasure and hosting rules", () => {
    const retention = privacy.sections.find((section) => section.body.includes("30") && section.body.includes("CDN/Discord"));
    expect(retention).toBeDefined();
    expect(retention?.body).toContain('href="mailto:{publisherEmail}"');
    const content = terms.sections.find((section) => section.body.includes("PNG/JPEG/WebP/GIF"));
    expect(content).toBeDefined();
    expect(content?.body).toContain("20");
    expect(content?.body).toMatch(/1 MiB|1 Mio/);
    expect(content?.body).toContain("{publisherEmail}");
  });
});