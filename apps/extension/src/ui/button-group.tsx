import type { ReactNode } from "react";

export const ButtonGroup = ({ children, label }: { children: ReactNode; label: string }) => (
  <div
    role="group"
    aria-label={label}
    className="inline-flex shrink-0 divide-x divide-line-strong overflow-hidden rounded-md border border-line-strong [&>*]:rounded-none!"
  >
    {children}
  </div>
);