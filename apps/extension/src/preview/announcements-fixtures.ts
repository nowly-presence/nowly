import { AnnouncementSchema } from "@nowly/shared/announcements";
import { emptyAnnouncements, type AnnouncementsState } from "@/shared/announcements";

export const previewAnnouncements = (): AnnouncementsState => {
  const now = Date.now();
  const items = [
    {
      id: "preview-maintenance",
      kind: "maintenance",
      pinned: true,
      severity: null,
      endsAt: new Date(now + 45 * 60_000).toISOString(),
      translations: {
        en: {
          title: "A little care for Nowly",
          description: "We are improving the library. Your saved activities keep working.",
          content:
            "## What's happening\n\nWe are updating the library infrastructure. **Your saved activities are not affected.**\n\n- Existing activities keep working.\n- New downloads may take a little longer.\n\nWe expect to be back shortly. This is an estimate, not a guaranteed completion time.\n\n[Service status](https://nowly.me/status)"
        },
        fr: {
          title: "Un peu d’attention pour Nowly",
          description: "Nous améliorons la bibliothèque. Vos activités enregistrées continuent de fonctionner.",
          content:
            "## Que se passe-t-il ?\n\nNous mettons à jour la bibliothèque. **Vos activités enregistrées ne sont pas affectées.**\n\n- Les activités existantes continuent de fonctionner.\n- Les nouveaux téléchargements peuvent prendre un peu plus de temps.\n\nL’heure de fin est une estimation, pas une garantie.\n\n[État des services](https://nowly.me/status)"
        }
      }
    },
    ...([1, 2, 3] as const).map((severity) => ({
      id: `preview-warning-${severity}`,
      kind: "warning",
      pinned: false,
      severity,
      endsAt: null,
      translations: {
        en: {
          title: ["A quick heads-up", "Downloads may be delayed", "Library temporarily unavailable"][severity - 1],
          description: "Your saved activities remain available. We are monitoring the service.",
          content: "## Service update\n\nWe are investigating. Your local activities are not affected.\n\n[Check the service status](https://nowly.me/status)"
        }
      }
    })),
    {
      id: "preview-release",
      kind: "normal",
      pinned: false,
      severity: null,
      endsAt: null,
      source: "changelog",
      translations: {
        en: {
          title: "2.4.0",
          description: "Custom activities, your way.",
          content:
            "## What's new\n\n### Custom activities\n\n- Create your own Discord activities.\n- Choose images, timers and buttons.\n- Share activities with JSON files.\n\n### Your panel\n\nArrange tabs to make Nowly feel like home."
        }
      }
    }
  ].map((item) =>
    AnnouncementSchema.parse({
      source: "announcement",
      startsAt: null,
      expiresAt: null,
      publishedAt: new Date(now - 60_000).toISOString(),
      updatedAt: new Date(now - 60_000).toISOString(),
      ...item
    })
  );
  return {
    ...emptyAnnouncements(),
    items,
    fetchedAt: now,
    offline: new URLSearchParams(location.search).get("announcements") === "offline",
    locale: "en"
  };
};