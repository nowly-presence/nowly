import { REPORT_ATTACHMENT_MAX_BYTES } from "@/shared/reports";

const ALLOWED_TYPES = ["image/png", "image/jpeg"];

export const readImageAttachment = (file: File): Promise<string | null> =>
  new Promise((resolve) => {
    if (!ALLOWED_TYPES.includes(file.type) || file.size > REPORT_ATTACHMENT_MAX_BYTES) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });