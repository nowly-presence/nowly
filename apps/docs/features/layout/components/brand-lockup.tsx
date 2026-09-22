"use client";

import { BRAND_LOCKUP_DARK, BRAND_LOCKUP_WHITE } from "@/lib/brand";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type BrandLockupProps = {
  width: number
  height: number
  className?: string
};

export const BrandLockup = ({ width, height, className }: BrandLockupProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <img
      src={mounted && resolvedTheme === "light" ? BRAND_LOCKUP_DARK : BRAND_LOCKUP_WHITE}
      alt="Nowly"
      width={width}
      height={height}
      className={className}
    />
  );
};
