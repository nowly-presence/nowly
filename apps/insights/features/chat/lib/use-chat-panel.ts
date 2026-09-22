"use client";

import { useState } from "react";

export const useChatPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, toggle: () => setIsOpen((v) => !v) };
};
