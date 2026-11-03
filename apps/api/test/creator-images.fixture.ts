import sharp from "sharp";

const OPAQUE = {
  r: 20,
  g: 40,
  b: 60,
  alpha: 1
};
const CLEAR = {
  r: 0,
  g: 0,
  b: 0,
  alpha: 0
};
const ICON_INSET = 8;

const dataUrl = (type: "png" | "jpeg", bytes: Buffer): string => `data:image/${type};base64,${bytes.toString("base64")}`;

export const pngImage = async (width: number, height: number, transparentEdge = false): Promise<string> => {
  if (!transparentEdge) return dataUrl(
    "png",
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: OPAQUE
      }
    })
      .png()
      .toBuffer()
  );

  const inner = await sharp({
    create: {
      width: width - ICON_INSET * 2,
      height: height - ICON_INSET * 2,
      channels: 4,
      background: OPAQUE
    }
  })
    .png()
    .toBuffer();

  const bytes = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: CLEAR
    }
  })
    .composite([
      {
        input: inner,
        left: ICON_INSET,
        top: ICON_INSET
      }
    ])
    .png()
    .toBuffer();
  return dataUrl("png", bytes);
};

export const jpegImage = async (width: number, height: number): Promise<string> =>
  dataUrl(
    "jpeg",
    await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: OPAQUE
      }
    })
      .jpeg()
      .toBuffer()
  );

export const creatorImages = async () => ({
  thumbnail: await jpegImage(1920, 1080),
  logo: await pngImage(300, 300),
  icon: await pngImage(128, 128, true)
});