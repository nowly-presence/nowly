import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { sampleCreatorDraft } from "@nowly/presence-creator/creator-fixtures";
import { buildCreatorZip } from "@/shared/creator/creator-zip";

describe("creator zip", () => {
  it("exports a zip with the presences repo layout", () => {
    const entries = unzipSync(buildCreatorZip(sampleCreatorDraft()));
    expect(Object.keys(entries).sort()).toEqual([
      "creator.json",
      "src/E/Example Tube/assets/icon.png",
      "src/E/Example Tube/assets/logo.png",
      "src/E/Example Tube/assets/thumbnail.jpg",
      "src/E/Example Tube/locales/en-US.json",
      "src/E/Example Tube/locales/fr-FR.json",
      "src/E/Example Tube/metadata.json",
      "src/E/Example Tube/presence.ts",
      "src/E/Example Tube/settings.ts"
    ]);
    expect(JSON.parse(strFromU8(entries["creator.json"]))).not.toHaveProperty("assets");
  });
});