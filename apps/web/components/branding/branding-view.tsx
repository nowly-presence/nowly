import {
  BRAND_ICON_BLUE,
  BRAND_ICON_BLUE_PNG,
  BRAND_ICON_DARK,
  BRAND_ICON_DARK_PNG,
  BRAND_ICON_WHITE,
  BRAND_ICON_WHITE_PNG,
  BRAND_LOCKUP_BLUE,
  BRAND_LOCKUP_BLUE_PNG,
  BRAND_LOCKUP_CANARY,
  BRAND_LOCKUP_CANARY_PNG,
  BRAND_LOCKUP_DARK,
  BRAND_LOCKUP_WHITE,
  BRAND_LOCKUP_WHITE_PNG,
  CANARY_ACCENT,
  CANARY_INK,
} from "@/lib/brand";
import { Card, CardContent, ButtonAnchor } from "@nowly/ui";
import { getTranslations } from "next-intl/server";

type ColorVariant = {
  key: "blue" | "dark" | "white" | "canary"
  svg: string
  png: string
  bg: string
};

const logoVariants: ColorVariant[] = [
  { key: "blue", svg: BRAND_LOCKUP_BLUE, png: BRAND_LOCKUP_BLUE_PNG, bg: "bg-[#07080c]" },
  { key: "dark", svg: BRAND_LOCKUP_DARK, png: BRAND_LOCKUP_BLUE_PNG, bg: "bg-[#eef5fc]" },
  { key: "white", svg: BRAND_LOCKUP_WHITE, png: BRAND_LOCKUP_WHITE_PNG, bg: "bg-[#07080c]" },
  { key: "canary", svg: BRAND_LOCKUP_CANARY, png: BRAND_LOCKUP_CANARY_PNG, bg: "bg-[#07080c]" },
];

const iconVariants: Array<{ key: "blue" | "dark" | "white"; svg: string; png: string; bg: string }> = [
  { key: "blue", svg: BRAND_ICON_BLUE, png: BRAND_ICON_BLUE_PNG, bg: "bg-[#07080c]" },
  { key: "dark", svg: BRAND_ICON_DARK, png: BRAND_ICON_DARK_PNG, bg: "bg-[#eef5fc]" },
  { key: "white", svg: BRAND_ICON_WHITE, png: BRAND_ICON_WHITE_PNG, bg: "bg-[#07080c]" },
];

const colorSwatches = [
  { key: "primary-light", hex: "#0891B2" },
  { key: "primary-dark", hex: "#22D3EE" },
  { key: "background-light", hex: "#eef5fc" },
  { key: "background-dark", hex: "#07080c" },
  { key: "canary-accent", hex: CANARY_ACCENT },
  { key: "canary-ink", hex: CANARY_INK },
];

export const BrandingView = async () => {
  const t = await getTranslations("brandingPage");

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <header className="max-w-xl">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">
            {t("description")}
          </p>
        </header>

        <section className="mt-14">
          <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {t("logo")}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {logoVariants.map((variant) => (
              <Card key={variant.key}>
                <CardContent className="flex flex-col gap-4">
                  <div className={`flex h-44 items-center justify-center rounded-[12px] ${variant.bg}`}>
                    <img src={variant.svg} alt="Nowly" className="h-16 w-auto" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{t(`variants.${variant.key}`)}</p>
                    <div className="flex gap-2">
                      <ButtonAnchor href={variant.svg} download variant="outline" size="sm">
                        {t("download-svg")}
                      </ButtonAnchor>
                      <ButtonAnchor href={variant.png} download variant="outline" size="sm">
                        {t("download-png")}
                      </ButtonAnchor>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {t("icon")}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {iconVariants.map((variant) => (
              <Card key={variant.key}>
                <CardContent className="flex flex-col gap-4">
                  <div className={`flex h-32 items-center justify-center rounded-[12px] ${variant.bg}`}>
                    <img src={variant.svg} alt="Nowly" className="size-14" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{t(`variants.${variant.key}`)}</p>
                    <div className="flex gap-2">
                      <ButtonAnchor href={variant.svg} download variant="outline" size="sm">
                        {t("download-svg")}
                      </ButtonAnchor>
                      <ButtonAnchor href={variant.png} download variant="outline" size="sm">
                        {t("download-png")}
                      </ButtonAnchor>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {t("colors")}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {colorSwatches.map((swatch) => (
              <div key={swatch.key} className="overflow-hidden rounded-[12px] border border-border">
                <div className="h-20" style={{ backgroundColor: swatch.hex }} />
                <div className="p-3">
                  <p className="text-xs font-medium text-foreground">{t(`swatches.${swatch.key}`)}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{swatch.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
