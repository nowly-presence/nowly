import type { LocalizedCopy } from "@/lib/library-catalog";

export type ChangelogRelease = {
  version: string
  slug: string
  date: string | null
  summary: LocalizedCopy
  banner?: string
};

const screenshot = (file: string): string =>
  `https://cdn.nowly.me/assets/screenshots/${file}`;

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: "2.0.0",
    slug: "2-0-0",
    date: "2026-09-17",
    banner: screenshot("home-updated.png"),
    summary: {
      "en-US": "Website rebrand, public library, privacy and data controls, ChromeOS awareness, desktop and Canary pages, legal docs, Chrome and Firefox, and an extension privacy/appearance pass.",
      "fr-FR": "Refonte du site, bibliothèque publique, gestion de la vie privée et des données, prise en compte de ChromeOS, pages bureau et Canary, textes légaux, Chrome et Firefox, et passe vie privée/apparence sur l'extension.",
      "es-ES": "Rediseño del sitio, biblioteca pública, gestión de privacidad y datos, soporte informativo de ChromeOS, páginas de escritorio y Canary, textos legales, Chrome y Firefox, y una pasada de privacidad/apariencia en la extensión.",
    },
  },
  {
    version: "1.4.0",
    slug: "1-4-0",
    date: "2026-09-14",
    summary: {
      "en-US": "Side panel rework with bottom navigation, in-panel library, pause and shortcuts, local zip install via nowly pack, and a dedicated page after extension updates.",
      "fr-FR": "Refonte du panneau avec navigation basse, bibliothèque intégrée, pause et raccourcis, install zip via nowly pack, et page dédiée après une mise à jour.",
      "es-ES": "Rediseño del panel con navegación inferior, biblioteca integrada, pausa y atajos, instalación zip con nowly pack, y una página dedicada tras actualizar.",
    },
  },
  {
    version: "1.3.0",
    slug: "1-3-0",
    date: "2026-07-14",
    summary: {
      "en-US": "Typed Discord activity language packs, global and per-presence language controls, and stable 1.0 SDK and CLI releases.",
      "fr-FR": "Packs de langues Discord typés, choix global ou par présence, et versions stables 1.0 du SDK et de la CLI.",
      "es-ES": "Paquetes de idioma de Discord tipados, selección global o por presencia, y versiones estables 1.0 del SDK y la CLI.",
    },
  },
  {
    version: "1.2.1",
    slug: "1-2-1",
    date: "2026-06-25",
    summary: {
      "en-US": "Hotfix: removes leaked development environment variables from the production build and simplifies API configuration.",
      "fr-FR": "Correctif: suppression des fuites de variables d’environnement de développement dans le build production, et simplification de la config API.",
      "es-ES": "Corrección: eliminación de fugas de variables de entorno de desarrollo en el build de producción, y simplificación de la config de la API.",
    },
  },
  {
    version: "1.2.0",
    slug: "1-2-0",
    date: "2026-06-25",
    summary: {
      "en-US": "UI overhaul of the extension, redesigned player, snooze and planning, and a cleaner settings layout.",
      "fr-FR": "Refonte UI de l’extension, nouveau lecteur, snooze et planning, et paramètres plus clairs.",
      "es-ES": "Renovación de la UI de la extensión, nuevo reproductor, snooze y planificación, y ajustes más claros.",
    },
  },
  {
    version: "1.1.0",
    slug: "1-1-0",
    date: null,
    summary: {
      "en-US": "First maintenance release: update flows, uninstall cleanup, docs cleanup, and release polish.",
      "fr-FR": "Première release de maintenance: flux de mise à jour, nettoyage à la désinstallation, doc, et polish.",
      "es-ES": "Primera release de mantenimiento: flujos de actualización, limpieza al desinstalar, docs y pulido.",
    },
  },
  {
    version: "1.0.0",
    slug: "1-0-0",
    date: "2026-06-10",
    summary: {
      "en-US": "First stable public launch: browser extension, desktop app, public library, and publishing workflow.",
      "fr-FR": "Première version publique stable: extension, application bureau, bibliothèque publique, et flux de publication.",
      "es-ES": "Primer lanzamiento público estable: extensión, app de escritorio, biblioteca pública y flujo de publicación.",
    },
  },
];

export const parseChangelogVersion = (value: string): { version: string; slug: string } | null => {
  const match = /^v?(\d+)[.-](\d+)[.-](\d+)$/i.exec(value.trim());
  if (!match) return null;
  return {
    version: `${match[1]}.${match[2]}.${match[3]}`,
    slug: `${match[1]}-${match[2]}-${match[3]}`,
  };
};

export const getChangelogRelease = (value: string): ChangelogRelease | null => {
  const parsed = parseChangelogVersion(value);
  if (!parsed) return null;
  return CHANGELOG_RELEASES.find((release) => release.slug === parsed.slug) ?? null;
};

export const changelogSummary = (release: ChangelogRelease, locale: string): string =>
  release.summary[locale as keyof LocalizedCopy] ?? release.summary["en-US"];

export const formatChangelogDate = (date: string, locale: string): string => {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(year, month - 1, day));
};
