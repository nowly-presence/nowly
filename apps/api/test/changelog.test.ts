import { generateChangelog, translateChangelog } from "@/shared/changelog.service"

describe("changelog service", () => {
  it("summarizes changed file categories without leaking a diff", async () => {
    const changelog = await generateChangelog({
      type: "modified",
      name: "Twitch",
      changedFiles: [
        "src/T/Twitch/locales/fr-FR.json",
        "src/T/Twitch/presence.ts",
      ],
    })

    expect(changelog["en-US"]).toBe("Added localized activity text and completed translations for Twitch.")
    expect(Object.keys(changelog)).toHaveLength(11)
    expect(changelog["de-DE"]).toBe("Lokalisierte Aktivitätstexte und vollständige Übersetzungen für Twitch hinzugefügt.")
    expect(changelog["ja-JP"]).toBe("Twitchのローカライズされたアクティビティテキストと翻訳を追加しました。")
    expect(changelog["en-US"]).not.toContain("diff --git")
  })

  it("uses localized descriptions for new presences", async () => {
    const changelog = await generateChangelog({
      type: "new",
      name: "Example",
      names: { "fr-FR": "Exemple" },
      descriptions: {
        "en-US": "Watch videos",
        "fr-FR": "Regarder des vidéos",
      },
    })

    expect(changelog["en-US"]).toBe("Add Example presence - Watch videos")
    expect(changelog["fr-FR"]).toBe("Ajout de Exemple - Regarder des vidéos")
    expect(changelog["es-ES"]).toBe("Añadir Example - Watch videos")
  })

  it("keeps explicit changelog text stable across supported locales", () => {
    const changelog = translateChangelog("Fixed playback")

    expect(Object.values(changelog).every((value) => value === "Fixed playback")).toBe(true)
  })
})
