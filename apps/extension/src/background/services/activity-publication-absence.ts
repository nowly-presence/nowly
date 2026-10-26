import { publicationAbsenceSchema } from "@nowly/shared/activity-publication";

const MAX_ABSENCE_BYTES = 256;

export const publicationAbsence = async (response: Response): Promise<"NOT_FOUND" | "UNPUBLISHED" | null> => {
  if (response.status !== 404 || response.redirected || !response.headers.get("content-type")?.includes("application/json")) return null;

  const reader = response.body?.getReader();

  if (!reader) return null;

  const chunks: Uint8Array[] = [];
  let length = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      length += value.byteLength;

      if (length > MAX_ABSENCE_BYTES) return null;

      chunks.push(value);
    }

    const bytes = new Uint8Array(length);
    let offset = 0;

    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const parsed = publicationAbsenceSchema.safeParse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
    return parsed.success ? parsed.data.error : null;
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
};