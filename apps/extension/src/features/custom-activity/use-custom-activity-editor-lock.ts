import { useEffect, useState } from "react";
import { connectCustomActivityEditor } from "@/lib/custom-activity-editor-messages";

export const useCustomActivityEditorLock = (id: string | null): boolean => {
  const [ready, setReady] = useState(!id);
  useEffect(() => {
    if (!id) return;

    return connectCustomActivityEditor(id, setReady);
  }, [id]);
  return ready;
};