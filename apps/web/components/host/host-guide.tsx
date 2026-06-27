import type { Platform } from "@/hooks/use-platform";
import { IconAlertTriangle, IconBooks } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";

type Props = {
  platform?: Exclude<Platform, "">;
};

export const HostGuide: FC<Props> = ({ platform }): ReactElement => {
  const t = useTranslations("host-page");

  const steps = [
    { step: "01", title: t("step1-title"), description: t("step1-desc") },
    { step: "02", title: t("step2-title"), description: t("step2-desc") },
    { step: "03", title: t("step3-title"), description: t("step3-desc"), link: { href: "/library", label: t("step3-link") } },
    { step: "04", title: t("step4-title"), description: t("step4-desc") },
  ];

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold tracking-tight mb-8">
        {t("guide-title")}
      </h2>

      <div className="space-y-6">
        {steps.map((item) => (
          <div key={item.step} className="flex gap-6">
            <span className="text-accent font-mono text-sm font-bold shrink-0 mt-1">
              {item.step}
            </span>
            <div>
              <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
              {"link" in item && item.link ? (
                <Link
                  href={item.link.href}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                >
                  {item.link.label}
                  <IconBooks className="size-4" />
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {platform === "windows" ? (
        <div className="mt-8 flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <IconAlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("windows-protect-title")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("windows-protect-description")}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
};