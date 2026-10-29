"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export const PlatformMarqueeControls = ({ children }: Props) => {
  return (
    <div className="mt-12">
      <div
        className="marquee-hover relative overflow-hidden py-3"
        style={{
          maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)"
        }}
      >
        {children}
      </div>
    </div>
  );
};