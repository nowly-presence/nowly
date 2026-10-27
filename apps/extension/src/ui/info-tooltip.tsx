import { useEffect, useId, useRef, useState } from "react";
import { RiInformationLine } from "@remixicon/react";
import { Button } from "@/ui/button";

export const InfoTooltip = ({ label, text }: {
  label: string;
  text: string;
}) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape, true);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!ref.current?.contains(document.activeElement)) setOpen(false);
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen(true)}
        icon={<RiInformationLine className="text-muted" />}
      />
      {open && (
        <span className="absolute right-0 bottom-full z-50 w-64 max-w-[calc(100vw-4rem)] pb-2">
          <span id={id} role="tooltip" className="block rounded-md border border-line bg-surface p-3 text-label-md font-normal whitespace-normal text-ink">
            {text}
          </span>
        </span>
      )}
    </span>
  );
};