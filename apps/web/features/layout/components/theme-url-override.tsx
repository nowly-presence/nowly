"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export const ThemeUrlOverride = () => {
  const { setTheme } = useTheme();

  useEffect(() => {
    const theme = new URLSearchParams(window.location.search).get("theme");
    if (theme === "light" || theme === "dark") setTheme(theme);
  }, [setTheme]);

  return null;
};
