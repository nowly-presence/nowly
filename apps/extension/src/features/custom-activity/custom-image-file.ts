import { CUSTOM_IMAGE_MAX_BYTES, isCustomImageMime } from "@/shared/custom-activity"
import type { CustomImageError } from "@/shared/custom-image"

export type ReadImageResult = { ok: true; dataUrl: string } | { ok: false; error: CustomImageError }

const MAX_DIMENSION = 1024
const RESIZE_STEPS = [
  { dimension: MAX_DIMENSION, quality: 0.9 },
  { dimension: 768, quality: 0.85 },
  { dimension: 512, quality: 0.8 },
] as const
const OUTPUT_MIME = "image/webp"

const toDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("READ_FAILED")))
    reader.onerror = () => reject(reader.error ?? new Error("READ_FAILED"))
    reader.readAsDataURL(blob)
  })

const encode = (bitmap: ImageBitmap, dimension: number, quality: number): Promise<Blob | null> => {
  const scale = Math.min(1, dimension / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob(resolve, OUTPUT_MIME, quality))
}

export const readImageFile = async (file: File): Promise<ReadImageResult> => {
  if (!isCustomImageMime(file.type)) return { ok: false, error: "UNSUPPORTED_TYPE" }
  if (file.type === "image/gif") return file.size > CUSTOM_IMAGE_MAX_BYTES ? { ok: false, error: "TOO_LARGE" } : { ok: true, dataUrl: await toDataUrl(file) }

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return { ok: false, error: "INVALID_IMAGE" }
  try {
    if (file.size <= CUSTOM_IMAGE_MAX_BYTES && Math.max(bitmap.width, bitmap.height) <= MAX_DIMENSION) return { ok: true, dataUrl: await toDataUrl(file) }
    for (const step of RESIZE_STEPS) {
      const blob = await encode(bitmap, step.dimension, step.quality)
      if (blob && blob.size <= CUSTOM_IMAGE_MAX_BYTES) return { ok: true, dataUrl: await toDataUrl(blob) }
    }
    return { ok: false, error: "TOO_LARGE" }
  } finally {
    bitmap.close()
  }
}
