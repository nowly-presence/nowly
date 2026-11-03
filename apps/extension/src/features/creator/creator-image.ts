export type CreatorAssetKind = "thumbnail" | "logo" | "icon";

type AssetSpec = {
  width: number;
  height: number;
  type: "image/png" | "image/jpeg";
  fit: "cover" | "contain";
};

export const ASSET_SPECS: Record<CreatorAssetKind, AssetSpec> = {
  thumbnail: {
    width: 1920,
    height: 1080,
    type: "image/jpeg",
    fit: "cover"
  },
  logo: {
    width: 300,
    height: 300,
    type: "image/png",
    fit: "cover"
  },
  icon: {
    width: 128,
    height: 128,
    type: "image/png",
    fit: "contain"
  }
};

export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/svg+xml";

const JPEG_QUALITY = 0.85;
const ALPHA_OPAQUE = 250;
const COLOR_SAMPLE_SIZE = 32;
const COLOR_BUCKET = 24;
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MIN_SATURATION = 30;
const MIN_BRIGHTNESS = 40;

export type ProcessedAsset = {
  dataUrl: string;
  upscaled: boolean;
  transparent: boolean;
};

export type CreatorImageErrorCode = "TOO_LARGE" | "UNREADABLE";

export const isCreatorImageError = (error: unknown, code: CreatorImageErrorCode): boolean => error instanceof Error && error.message === code;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("UNREADABLE"));
    };
    image.src = url;
  });

const hasTransparentEdge = (context: CanvasRenderingContext2D, width: number, height: number): boolean => {
  const { data } = context.getImageData(0, 0, width, height);
  const alphaAt = (x: number, y: number) => data[(y * width + x) * 4 + 3];

  for (let x = 0; x < width; x++) if (alphaAt(x, 0) < ALPHA_OPAQUE || alphaAt(x, height - 1) < ALPHA_OPAQUE) return true;

  for (let y = 0; y < height; y++) if (alphaAt(0, y) < ALPHA_OPAQUE || alphaAt(width - 1, y) < ALPHA_OPAQUE) return true;

  return false;
};

export const processAsset = async (file: File, kind: CreatorAssetKind): Promise<ProcessedAsset> => {
  if (file.size > MAX_FILE_BYTES) throw new Error("TOO_LARGE");

  const image = await loadImage(file);

  const spec = ASSET_SPECS[kind];
  const canvas = document.createElement("canvas");
  canvas.width = spec.width;
  canvas.height = spec.height;
  const context = canvas.getContext("2d");

  if (!context) throw new Error("UNREADABLE");

  const sourceWidth = image.naturalWidth || spec.width;
  const sourceHeight = image.naturalHeight || spec.height;
  const scale =
    spec.fit === "cover"
      ? Math.max(spec.width / sourceWidth, spec.height / sourceHeight)
      : Math.min(spec.width / sourceWidth, spec.height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;

  if (spec.type === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, spec.width, spec.height);
  }

  context.imageSmoothingQuality = "high";
  context.drawImage(image, (spec.width - drawWidth) / 2, (spec.height - drawHeight) / 2, drawWidth, drawHeight);
  return {
    dataUrl: canvas.toDataURL(spec.type, JPEG_QUALITY),
    upscaled: scale > 1,
    transparent: spec.type === "image/png" && hasTransparentEdge(context, spec.width, spec.height)
  };
};

const toHex = (value: number) => Math.round(value).toString(16).padStart(2, "0");

export const dominantColor = (dataUrl: string): Promise<string | null> =>
  new Promise((resolve) => {
    const image = new Image();
    image.onerror = () => resolve(null);
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = COLOR_SAMPLE_SIZE;
      canvas.height = COLOR_SAMPLE_SIZE;
      const context = canvas.getContext("2d");

      if (!context) return resolve(null);

      context.drawImage(image, 0, 0, COLOR_SAMPLE_SIZE, COLOR_SAMPLE_SIZE);
      const { data } = context.getImageData(0, 0, COLOR_SAMPLE_SIZE, COLOR_SAMPLE_SIZE);
      const buckets = new Map<
        string,
        {
          count: number;
          r: number;
          g: number;
          b: number;
        }
      >();

      for (let index = 0; index < data.length; index += 4) {
        const [r, g, b, a] = [data[index], data[index + 1], data[index + 2], data[index + 3]];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        if (a < ALPHA_OPAQUE || max - min < MIN_SATURATION || max < MIN_BRIGHTNESS) continue;

        const key = [r, g, b].map((channel) => Math.floor(channel / COLOR_BUCKET)).join("-");
        const bucket = buckets.get(key) ?? {
          count: 0,
          r: 0,
          g: 0,
          b: 0
        };
        buckets.set(key, {
          count: bucket.count + 1,
          r: bucket.r + r,
          g: bucket.g + g,
          b: bucket.b + b
        });
      }

      const best = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
      resolve(best ? `#${toHex(best.r / best.count)}${toHex(best.g / best.count)}${toHex(best.b / best.count)}` : null);
    };
    image.src = dataUrl;
  });