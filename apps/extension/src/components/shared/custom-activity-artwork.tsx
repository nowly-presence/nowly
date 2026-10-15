import { useEffect, useState } from "react"
import {
  RiBookOpenFill,
  RiBrushFill,
  RiCameraFill,
  RiChat3Fill,
  RiCodeSSlashFill,
  RiComputerFill,
  RiCupFill,
  RiFilmFill,
  RiFlaskFill,
  RiGamepadFill,
  RiGraduationCapFill,
  RiHeadphoneFill,
  RiMicFill,
  RiMoonFill,
  RiMusic2Fill,
  RiPaletteFill,
  RiPencilFill,
  RiPlaneFill,
  RiRestaurantFill,
  RiRocketFill,
  RiRunFill,
  RiSparklingFill,
  RiTrophyFill,
  RiTvFill,
  type RemixiconComponentType,
} from "@remixicon/react"
import { useCustomImageSrc } from "@/hooks/use-custom-image-data"
import type { CustomActivityIcon, CustomImage } from "@/shared/types"
import { brandIcon } from "@/shared/brand"
import { cn } from "@/ui/cn"

export const CUSTOM_ACTIVITY_ICON_COMPONENTS: Record<CustomActivityIcon, RemixiconComponentType> = {
  gamepad: RiGamepadFill,
  trophy: RiTrophyFill,
  code: RiCodeSSlashFill,
  computer: RiComputerFill,
  book: RiBookOpenFill,
  graduation: RiGraduationCapFill,
  pencil: RiPencilFill,
  brush: RiBrushFill,
  palette: RiPaletteFill,
  camera: RiCameraFill,
  film: RiFilmFill,
  tv: RiTvFill,
  music: RiMusic2Fill,
  headphone: RiHeadphoneFill,
  mic: RiMicFill,
  chat: RiChat3Fill,
  coffee: RiCupFill,
  restaurant: RiRestaurantFill,
  run: RiRunFill,
  plane: RiPlaneFill,
  moon: RiMoonFill,
  rocket: RiRocketFill,
  flask: RiFlaskFill,
  sparkling: RiSparklingFill,
}

type ArtworkSource = { largeImage: CustomImage; smallImage?: CustomImage }

const ICON_RATIO = 0.46
const SMALL_RATIO = 0.36
const SMALL_MIN = 16

export const CustomActivityGlyph = ({ color, icon, size, rounded = "rounded-sm", className }: { color: string; icon: CustomActivityIcon; size: number; rounded?: string; className?: string }) => {
  const Icon = CUSTOM_ACTIVITY_ICON_COMPONENTS[icon]
  return (
    <span style={{ width: size, height: size, backgroundColor: color }} className={cn("flex shrink-0 items-center justify-center text-white", rounded, className)} aria-hidden>
      <Icon style={{ width: size * ICON_RATIO, height: size * ICON_RATIO }} />
    </span>
  )
}

const NowlyMark = ({ className }: { className: string }) => {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <span className={cn("flex items-center justify-center bg-surface", className)} aria-hidden>
        <span className="size-1/3 rounded-full bg-primary" />
      </span>
    )
  }
  return <img src={brandIcon("blue", 256)} alt="" draggable={false} onError={() => setFailed(true)} className={cn("bg-surface object-contain p-[12%]", className)} />
}

export const CustomImageView = ({ image, size, rounded, fallback, className }: { image: CustomImage; size: number; rounded: string; fallback: "nowly" | "none"; className?: string }) => {
  const src = useCustomImageSrc(image)
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  const box = cn("size-full", rounded, className)
  if (image.kind === "icon") return <CustomActivityGlyph color={image.color} icon={image.icon} size={size} rounded={rounded} className={className} />
  if (src && !failed) return <img src={src} alt="" draggable={false} onError={() => setFailed(true)} className={cn(box, "bg-hover object-cover")} />
  return fallback === "nowly" ? <NowlyMark className={box} /> : null
}

export const CustomActivityArtwork = ({ source, size = 36, rounded = "rounded-sm", showSmall = false, ringClassName = "border-surface bg-surface", className }: {
  source: ArtworkSource
  size?: number
  rounded?: string
  showSmall?: boolean
  ringClassName?: string
  className?: string
}) => {
  const small = Math.max(SMALL_MIN, Math.round(size * SMALL_RATIO))
  return (
    <span className={cn("relative flex shrink-0", className)} style={{ width: size, height: size }}>
      <CustomImageView image={source.largeImage} size={size} rounded={rounded} fallback="nowly" />
      {showSmall && source.smallImage && source.smallImage.kind !== "none" && (
        <span className={cn("absolute -right-1 -bottom-1 flex overflow-hidden rounded-full border-2", ringClassName)} style={{ width: small + 4, height: small + 4 }}>
          <CustomImageView image={source.smallImage} size={small} rounded="rounded-full" fallback="none" />
        </span>
      )}
    </span>
  )
}
