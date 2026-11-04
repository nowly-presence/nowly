import { useEffect } from "react";
import type { TextSize } from "@/shared/types";

export const useTextSize = (textSize: TextSize | undefined) => {
  useEffect(() => {
    document.documentElement.dataset.textSize = textSize ?? "medium";
  }, [textSize]);
};