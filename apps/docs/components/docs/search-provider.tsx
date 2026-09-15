"use client";

import { SearchCommand } from "@/components/docs/search-command";
import { useHotkeys } from "react-hotkeys-hook";
import { useState, type FC, type ReactNode } from "react";

const SearchProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);

  useHotkeys(
    "mod+k",
    (e) => {
      e.preventDefault();
      setOpen(true);
    },
    { enableOnFormTags: ["input", "textarea"] },
  );

  return (
    <>
      <SearchCommand open={open} onOpenChange={setOpen} />
      {children}
    </>
  );
};

export { SearchProvider };
