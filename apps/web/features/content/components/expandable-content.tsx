"use client";

import { buttonVariants } from "@nowly/ui/button-variants";
import { RiArrowDownSLine, RiArrowUpSLine } from "@nowly/ui/icons";
import { cn } from "@nowly/ui/utils";
import { useId, useRef, useState, type ReactNode } from "react";

type ExpandableContentProps = {
  children: ReactNode
  openLabel: string
  closeLabel: string
  className?: string
};

// Shows the start of a long text that fades into a blur, with a button to read the rest.
export const ExpandableContent = ({ children, openLabel, closeLabel, className }: ExpandableContentProps) => {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    rootRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <div ref={rootRef} className={cn("relative scroll-mt-32", className)}>
      <div
        id={contentId}
        className={cn(
          !open && "max-h-80 overflow-hidden mask-[linear-gradient(to_bottom,black_30%,transparent_92%)]",
        )}
      >
        {children}
      </div>

      {open ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            aria-controls={contentId}
            aria-expanded
            onClick={close}
            className={buttonVariants({ variant: "outline" })}
          >
            {closeLabel}
            <RiArrowUpSLine data-icon="inline-end" />
          </button>
        </div>
      ) : (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-44 backdrop-blur-[3px] mask-[linear-gradient(to_bottom,transparent,black_65%)]"
          />
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <button
              type="button"
              aria-controls={contentId}
              aria-expanded={false}
              onClick={() => setOpen(true)}
              className={cn(buttonVariants({ variant: "inverted", size: "lg" }), "shadow-[0_8px_30px_rgba(7,8,12,0.18)]")}
            >
              {openLabel}
              <RiArrowDownSLine data-icon="inline-end" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
