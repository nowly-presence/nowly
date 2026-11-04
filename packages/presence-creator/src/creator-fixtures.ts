import { createDraft, createPage, createVariable } from "./creator-draft";
import type { CreatorDraft } from "./creator-types";

export const sampleCreatorDraft = (): CreatorDraft => {
  const title = createVariable(
    "title",
    {
      kind: "element",
      selector: "h1.video-title",
      read: "text"
    },
    "Lo-fi beats"
  );
  const channel = createVariable(
    "channel",
    {
      kind: "element",
      selector: "#owner a",
      read: "text"
    },
    "Nowly Radio"
  );
  const poster = createVariable(
    "poster",
    {
      kind: "meta",
      property: "og:image"
    },
    "https://img.example.com/poster.jpg"
  );
  const videoId = createVariable(
    "videoId",
    {
      kind: "element",
      selector: "#video-id",
      read: "text"
    },
    "abc123"
  );
  const watch = {
    ...createPage("Watch", "/watch"),
    variables: [title, channel, poster, videoId],
    details: {
      "en-US": "Watching {title}",
      "fr-FR": "Regarde {title}"
    },
    state: {
      "en-US": "by {channel}",
      "fr-FR": "par {channel}"
    },
    largeImage: {
      kind: "variable" as const,
      variableId: poster.id
    },
    timestamps: "media" as const,
    buttons: [
      {
        id: "b1",
        label: {
          "en-US": "Watch video",
          "fr-FR": "Voir la vidéo"
        },
        link: {
          kind: "custom" as const,
          template: "https://example.com/v/{videoId}"
        }
      }
    ]
  };
  const search = {
    ...createPage("Search", "/results"),
    activityType: "watching" as const,
    details: {
      "en-US": "Searching videos",
      "fr-FR": "Cherche des vidéos"
    },
    timestamps: "elapsed" as const
  };
  return {
    ...createDraft("en-US", "example.com", 0),
    assets: {
      thumbnail: "data:image/jpeg;base64,AAAA",
      logo: "data:image/png;base64,AAAA",
      icon: "data:image/png;base64,AAAA",
      iconTransparent: true,
      thumbnailRightsConfirmed: true
    },
    name: "Example Tube",
    color: "#FF0033",
    category: "video",
    translationMode: "manual",
    locales: ["en-US", "fr-FR"],
    description: {
      "en-US": "Show the video you watch on Example Tube.",
      "fr-FR": "Affichez la vidéo que vous regardez sur Example Tube."
    },
    longDescription: { "en-US": "Example Tube is a video site." },
    features: [
      {
        "en-US": "Detects the current video",
        "fr-FR": "Détecte la vidéo en cours"
      }
    ],
    pages: [watch, search],
    browsingFallback: true,
    author: {
      name: "Gaëtan H",
      github: "steellgold"
    }
  };
};