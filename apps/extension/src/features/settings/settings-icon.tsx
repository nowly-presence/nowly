import type { ReactNode } from "react";

export const SettingsIcon = ({ icon }: {
  icon: ReactNode;
}) => (
  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-hover">
    {icon}
  </span>
);
