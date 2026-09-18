"use client";

import { Button } from "@nowly/ui";

import { RiMoonLine, RiSunLine } from "@nowly/ui/icons";
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

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t("toggle")}
      title={mounted ? (isDark ? t("light") : t("dark")) : t("toggle")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <RiSunLine /> : <RiMoonLine />}
    </Button>
  );
};
