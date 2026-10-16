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

const messagesDirectory = resolve(import.meta.dirname, "../../messages");
const locales = readdirSync(messagesDirectory).filter((file) => file.endsWith(".json"));

describe.each(locales)("legal content in %s", (file) => {
  const messages: Record<"privacy-page" | "tos-page", LegalPage> = JSON.parse(readFileSync(resolve(messagesDirectory, file), "utf8"));
  const privacy = messages["privacy-page"];
  const terms = messages["tos-page"];

  it("keeps complete localized documents with unique titles and matching update dates", () => {
    expect(privacy.sections).toHaveLength(19);
    expect(terms.sections).toHaveLength(13);
    expect(privacy["last-updated"]).toBe(terms["last-updated"]);

    for (const page of [privacy, terms]) {
      expect(new Set(page.sections.map((section) => section.title)).size).toBe(page.sections.length);

      for (const section of page.sections) {
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.body.length).toBeGreaterThan(0);
      }
    }
  });

  it("discloses uploads and device metadata in every locale", () => {
    const upload = privacy.sections.find((section) => section.body.includes("Cloudflare R2"));
    expect(upload).toBeDefined();

    for (const detail of ["2.4.0", "UUID", "SHA-256", "MIME", "JSON", "HTTPS"]) expect(upload?.body).toContain(detail);

    expect(upload?.body).toMatch(/GDPR|RGPD|DSGVO|ΓΚΠΔ|RODO|GVKT/);
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