import { useEffect, useRef, useState } from "react";

const hasFiles = (event: DragEvent): boolean => event.dataTransfer?.types.includes("Files") === true;

export const useFileDrop = (onFiles: (files: File[]) => void, enabled: boolean): boolean => {
  const [dragging, setDragging] = useState(false);
  const handler = useRef(onFiles);

  useEffect(() => {
    handler.current = onFiles;
  }, [onFiles]);

  useEffect(() => {
    if (!enabled) return;

    let depth = 0;
    const enter = (event: DragEvent) => {
      if (!hasFiles(event)) return;

      event.preventDefault();
      depth += 1;
      setDragging(true);
    };
    const over = (event: DragEvent) => {
      if (!hasFiles(event)) return;

      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    };
    const leave = (event: DragEvent) => {
      if (!hasFiles(event)) return;

      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const drop = (event: DragEvent) => {
      if (!hasFiles(event)) return;

      event.preventDefault();
      depth = 0;
      setDragging(false);
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length > 0) handler.current(files);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
      setDragging(false);
    };
  }, [enabled]);

  return enabled && dragging;
};