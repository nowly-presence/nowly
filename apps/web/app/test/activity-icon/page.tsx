import type { Metadata } from "next";

import {
  ACTIVITY_ICON_COLORS,
  ACTIVITY_ICON_KEYS,
  type ActivityIconKey,
} from "../../api/activity-icon/activity-icons";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const PREVIEW_ICON: ActivityIconKey = "gamepad";
const PREVIEW_COLOR = "5a6bb0";

const activityIconUrl = (icon: ActivityIconKey, color: string) =>
  `/api/activity-icon/${icon}/${color}.png?v=1`;

const ActivityIconPreview = ({ icon, color }: { icon: ActivityIconKey; color: string }) => {
  const src = activityIconUrl(icon, color);

  return (
    <div className="flex items-center gap-6 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-foreground/55">Large</p>
        <img src={src} alt={`${icon} large preview`} className="size-20 rounded-[22%]" />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-foreground/55">Small</p>
        <img src={src} alt={`${icon} small preview`} className="size-6 rounded-full" />
      </div>
      <p className="ml-auto font-mono text-xs text-foreground/55">{icon} / {color}</p>
    </div>
  );
};

const Page = () => (
  <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-10 sm:py-16">
    <div className="mx-auto max-w-6xl">
      <header className="max-w-2xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-accent">Activity icon test</p>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Custom activity icon renders</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Every supported icon and color combination, rendered through the public Discord image route.
        </p>
      </header>

      <section className="mt-10" aria-labelledby="preview-title">
        <h2 id="preview-title" className="text-xl font-medium">Discord preview</h2>
        <div className="mt-4 max-w-md">
          <ActivityIconPreview icon={PREVIEW_ICON} color={PREVIEW_COLOR} />
        </div>
      </section>

      <section className="mt-12" aria-labelledby="grid-title">
        <h2 id="grid-title" className="text-xl font-medium">All combinations</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {ACTIVITY_ICON_KEYS.flatMap((icon) =>
            ACTIVITY_ICON_COLORS.map((color) => {
              const src = activityIconUrl(icon, color);

              return (
                <div key={`${icon}-${color}`} className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-2">
                  <img src={src} alt={`${icon} on ${color}`} className="aspect-square w-full rounded-lg" />
                  <p className="mt-2 truncate text-center font-mono text-[10px] text-foreground/55">{icon}</p>
                </div>
              );
            }),
          )}
        </div>
      </section>
    </div>
  </main>
);

export default Page;
