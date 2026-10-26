import { readReleaseAnnouncements } from "@/features/announcements/announcements.changelog";

const files = vi.hoisted(() => ({
  readdir: vi.fn(),
  readFile: vi.fn()
}));

vi.mock("node:fs/promises", () => files);

const document = (date: string, extra = "") => `---\ntitle: 2.4.0\ndate: ${date}\ndescription: A published release\n${extra}---\n## Safe markdown\n\n**Hello**`;

describe("release announcements", () => {
  beforeEach(() => {
    files.readdir.mockResolvedValue(["2-4-0", "2-5-0", "2-6-0", "2-7-0", "2-8-0", "../private"]);
    files.readFile.mockImplementation(async (path: string) => {
      if (path.includes("2-5-0")) return document("2999-01-01");
      if (path.includes("2-6-0")) return document("null");
      if (path.includes("2-7-0")) return document("2026-01-01", "draft: true\n");
      if (path.includes("2-8-0")) return document("2026-01-01", "published: false\n");

      return document("2026-01-01");
    });
  });
  it("includes rendered-source markdown but never future, undated, draft or unpublished releases", async () => {
    const result = await readReleaseAnnouncements("en", Date.parse("2026-10-24"));
    expect(result.map((item) => item.id)).toEqual(["release-2-4-0"]);
    expect(result[0].translations.en?.content).toContain("## Safe markdown");
    expect(files.readFile.mock.calls.every(([path]) => !String(path).includes("private"))).toBe(true);
  });
  it("uses the canonical English publication date even if a translation has a past date", async () => {
    const result = await readReleaseAnnouncements("fr", Date.parse("2026-10-24"));
    expect(result.map((item) => item.id)).toEqual(["release-2-4-0"]);
    expect(files.readFile.mock.calls.some(([path]) => String(path).includes("2-5-0/fr-FR"))).toBe(false);
  });

  const expectCanonicalFallback = async (flag: string) => {
    files.readdir.mockResolvedValue(["2-4-0"]);
    files.readFile.mockImplementation(async (path: string) =>
      path.endsWith("fr-FR.mdx")
        ? document("2000-01-01", `${flag}\n`).replace("A published release", "PRIVATE LOCALIZED DESCRIPTION").replace("**Hello**", "PRIVATE LOCALIZED BODY")
        : document("2026-01-01")
    );
    const result = await readReleaseAnnouncements("fr", Date.parse("2026-10-24"));
    expect(result).toHaveLength(1);
    expect(result[0].publishedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(result[0].translations.fr?.description).toBe("A published release");
    expect(result[0].translations.fr?.content).toContain("**Hello**");
    expect(JSON.stringify(result)).not.toContain("PRIVATE LOCALIZED");
  };

  it("falls back to published canonical text when the localized release is a draft", async () => {
    await expectCanonicalFallback("draft: true");
  });

  it("falls back to published canonical text when the localized release is explicitly unpublished", async () => {
    await expectCanonicalFallback("published: false");
  });

  it("includes the existing English-language launch date while rejecting undetermined and invalid dates", async () => {
    files.readdir.mockResolvedValue(["1-0-0", "1-1-0", "1-2-0"]);
    files.readFile.mockImplementation(async (path: string) => {
      if (path.includes("1-0-0")) return document("June 10, 2026");
      if (path.includes("1-1-0")) return document("To be determined");

      return document("2026-02-31");
    });
    const result = await readReleaseAnnouncements("en", Date.parse("2026-10-24"));
    expect(result.map((item) => item.id)).toEqual(["release-1-0-0"]);
    expect(result[0].publishedAt).toBe("2026-06-10T00:00:00.000Z");
  });
});