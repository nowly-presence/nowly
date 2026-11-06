import type { ReactNode } from "react";

export const ChatMarker = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-3 text-label-sm text-muted" role="separator">
    <span className="h-px flex-1 bg-line" />
    <span className="text-center">{children}</span>
    <span className="h-px flex-1 bg-line" />
  </div>
);