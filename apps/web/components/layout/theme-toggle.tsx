"use client";

import { Button } from "@/components/ui/button";
import { RiMoonLine, RiSunLine } from "@remixicon/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const t = useTranslations("theme");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t("toggle")}
      title={isDark ? t("light") : t("dark")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && isDark ? <RiSunLine /> : <RiMoonLine />}
    </Button>
  );
};
