"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  pauseLabel: string;
  playLabel: string;
};

export const PlatformMarqueeControls = ({ children, pauseLabel, playLabel }: Props) => {
  const [paused, setPaused] = useState(false);

  return (
    <div className="mt-12">
      <div className="flex justify-end px-2">
        <button
          type="button"
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm"
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? playLabel : pauseLabel}
        </button>
      </div>
      <div
        data-paused={paused}
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
