import type { PropsWithChildren } from "react";

export const PageContainer = ({ children }: PropsWithChildren) => (
  <div className="w-full px-4 sm:px-6 lg:px-10">
    <div className="mx-auto w-full max-w-300 px-3 sm:px-4">{children}</div>
  </div>
);