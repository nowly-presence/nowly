import { IconDeviceDesktopCheck, IconShieldCheck, IconServerOff } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

const icons = [IconDeviceDesktopCheck, IconShieldCheck, IconServerOff] as const;

export const HostTrust: FC = (): ReactElement => {
  const t = useTranslations("host-page");
  const items = t.raw("trust-items") as Array<{
    title: string
    description: string
  }>;

  return (
    <section className="mb-16">
      <div className="mb-8">
        <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">
          {t("trust-badge")}
        </span>
        <h2 className="text-2xl font-bold tracking-tight mb-3">
          {t("trust-title")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("trust-description")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => {
          const Icon = icons[index] ?? IconShieldCheck;

          return (
            <article key={item.title} className="rounded-lg border border-border bg-card p-5">
              <span className="mb-5 flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icon className="size-5" />
              </span>

              <h3 className="mb-2 font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
};
