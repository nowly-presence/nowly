import { RiCheckLine, RiShuffleLine } from "@remixicon/react";
import {
  CUSTOM_ACTIVITY_ICON_COMPONENTS,
  CustomActivityGlyph,
} from "@/components/shared/custom-activity-artwork";
import { useI18n } from "@/hooks/i18n-provider";
import {
  CUSTOM_ACTIVITY_COLORS,
  CUSTOM_ACTIVITY_ICONS,
  randomIconImage,
} from "@/shared/custom-activity";
import type { CustomImage } from "@/shared/types";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";

type IconImage = Extract<CustomImage, { kind: "icon" }>;

const PREVIEW_SIZE = 56;

export const CustomIconPicker = ({
  value,
  onChange,
  round,
}: {
  value: IconImage;
  onChange: (image: IconImage) => void;
  round?: boolean;
}) => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <CustomActivityGlyph
          color={value.color}
          icon={value.icon}
          size={PREVIEW_SIZE}
          rounded={round ? "rounded-full" : "rounded-md"}
        />
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            icon={<RiShuffleLine className="size-4" />}
            onClick={() => onChange(randomIconImage())}
          >
            {t("custom.appearance.shuffle")}
          </Button>
          <span className="text-label-sm text-muted">
            {t("custom.image.iconHint")}
          </span>
        </div>
      </div>
      <div
        role="radiogroup"
        aria-label={t("custom.appearance.color")}
        className="flex flex-wrap gap-2"
      >
        {CUSTOM_ACTIVITY_COLORS.map((color) => {
          const selected = value.color === color;
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={color}
              onClick={() => onChange({ ...value, color })}
              style={{ backgroundColor: color }}
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-white transition-transform hover:scale-105",
                selected && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
              )}
            >
              {selected && <RiCheckLine className="size-4" />}
            </button>
          );
        })}
      </div>
      <div
        role="radiogroup"
        aria-label={t("custom.appearance.icon")}
        className="grid grid-cols-8 gap-1.5"
      >
        {CUSTOM_ACTIVITY_ICONS.map((icon) => {
          const Icon = CUSTOM_ACTIVITY_ICON_COMPONENTS[icon];
          const selected = value.icon === icon;
          return (
            <button
              key={icon}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={t(`custom.icon.${icon}`)}
              title={t(`custom.icon.${icon}`)}
              onClick={() => onChange({ ...value, icon })}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md border transition-colors",
                selected
                  ? "border-transparent text-white"
                  : "border-line text-muted hover:border-line-strong hover:text-ink",
              )}
              style={selected ? { backgroundColor: value.color } : undefined}
            >
              <Icon className="size-[18px]" />
            </button>
          );
        })}
      </div>
    </div>
  );
};