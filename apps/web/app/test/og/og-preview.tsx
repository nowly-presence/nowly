"use client";

import { useMemo, useState } from "react";

type Preset = {
  label: string
  title: string
  description: string
  badge: string
  accent: string
  logo: string
};

const PRESETS: Preset[] = [
  {
    label: "Home (defaut)",
    title: "Nowly | Share what you do, in real time",
    description: "Nowly turns what you watch, listen to, or play into a rich, live Discord presence.",
    badge: "",
    accent: "",
    logo: "",
  },
  {
    label: "Presence (Spotify)",
    title: "Spotify",
    description: "Show what you're listening to on Spotify, live in Discord.",
    badge: "Music",
    accent: "#1DB954",
    logo: "https://cdn.nowly.me/presences/spotify/assets/logo.png",
  },
  {
    label: "Presence (Netflix)",
    title: "Netflix",
    description: "Share what you're watching on Netflix with your Discord friends.",
    badge: "Streaming",
    accent: "#E50914",
    logo: "https://cdn.nowly.me/presences/netflix/assets/logo.png",
  },
  {
    label: "Legal page",
    title: "Privacy Policy",
    description: "How Nowly collects, uses, and protects your data.",
    badge: "",
    accent: "",
    logo: "",
  },
];

export const OgPreview = () => {
  const [form, setForm] = useState<Preset>(PRESETS[0]!);

  const imageUrl = useMemo(() => {
    const search = new URLSearchParams({ title: form.title, description: form.description });
    if (form.badge) search.set("badge", form.badge);
    if (form.accent) search.set("accent", form.accent);
    if (form.logo) search.set("logo", form.logo);
    search.set("cache", Date.now().toString());
    return `/api/og?${search.toString()}`;
  }, [form]);

  const update = (key: keyof Preset) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">OG image preview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Page interne (noindex) pour visualiser /api/og avant deploiement. Pas de lien depuis le site, pas dans le sitemap.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setForm(preset)}
            className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-foreground/5"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            value={form.title}
            onChange={update("title")}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Badge (optionnel)
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            value={form.badge}
            onChange={update("badge")}
          />
        </label>
        <label className="col-span-full flex flex-col gap-1 text-sm">
          Description
          <textarea
            className="rounded-md border border-border bg-background px-3 py-2"
            rows={2}
            value={form.description}
            onChange={update("description")}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Accent color (hex, optionnel)
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            value={form.accent}
            onChange={update("accent")}
            placeholder="#22d3ee"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Logo URL (optionnel)
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            value={form.logo}
            onChange={update("logo")}
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <img key={imageUrl} src={imageUrl} alt="OG preview" width={1200} height={630} className="w-full" />
      </div>

      <p className="break-all text-xs text-muted-foreground">{imageUrl}</p>
    </div>
  );
};
