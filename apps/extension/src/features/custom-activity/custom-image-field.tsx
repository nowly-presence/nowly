import { useId, useRef, useState, type ChangeEvent } from "react";
import { RiImageAddLine, RiLink, RiPencilLine } from "@remixicon/react";
import { useCustomImageSrc } from "@/hooks/use-custom-image-data";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { CUSTOM_IMAGE_MAX_BYTES, CUSTOM_IMAGE_MIMES, CUSTOM_TEXT_MAX_LENGTH, type CustomActivityError } from "@/shared/custom-activity";
import type { CustomImage } from "@/shared/types";
import { Button, Spinner } from "@/ui/button";
import { cn } from "@/ui/cn";
import { FieldRow } from "@/ui/field-row";
import { Input } from "@/ui/input";
import { InfoTooltip } from "@/ui/info-tooltip";
import { Segmented } from "@/ui/segmented";
import { useToast } from "@/ui/toast";
import { CustomActivityArtwork } from "@/components/shared/custom-activity-artwork";
import { randomIconImage } from "@/shared/custom-activity";
import { readImageFile } from "@/features/custom-activity/custom-image-file";
import { CustomIconPicker } from "@/features/custom-activity/custom-icon-picker";
import { FieldError } from "@/features/custom-activity/custom-field-error";

type Mode = CustomImage["kind"];

type CustomImageFieldProps = {
  title: string;
  description: string;
  image: CustomImage;
  onImageChange: (image: CustomImage) => void;
  hoverText: string;
  onHoverTextChange: (value: string) => void;
  hoverError?: CustomActivityError;
  imageError?: CustomActivityError;
  upload: (dataUrl: string) => Promise<CustomImage | null>;
  uploading: boolean;
  round?: boolean;
  noneShowsNowly?: boolean;
  listeningHint?: boolean;
};

const READ_ERRORS: Record<string, MessageKey> = {
  TOO_LARGE: "custom.image.errorTooLarge",
  UNSUPPORTED_TYPE: "custom.image.errorType",
  INVALID_IMAGE: "custom.image.errorInvalid"
};

const MB = 1024 * 1024;
const PREVIEW_SIZE = 56;

const Preview = ({ image, round }: {
  image: CustomImage;
  round?: boolean;
}) => {
  const src = useCustomImageSrc(image);
  const shape = round ? "rounded-full" : "rounded-md";

  if (!src) {
    return (
      <span className={cn("flex size-14 shrink-0 items-center justify-center border border-dashed border-line-strong text-muted", shape)}>
        <RiImageAddLine className="size-5" />
      </span>
    );
  }

  return <img src={src} alt="" draggable={false} className={cn("size-14 shrink-0 border border-line bg-hover object-cover", shape)} />;
};

const UrlThumb = ({ image, round }: {
  image: CustomImage;
  round?: boolean;
}) => {
  const src = useCustomImageSrc(image);
  const [loaded, setLoaded] = useState<string | null>(null);
  return (
    <span className="relative flex size-5 items-center justify-center">
      {loaded !== src && <RiLink />}
      {src && (
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          onLoad={() => setLoaded(src)}
          onError={() => setLoaded(null)}
          className={cn("absolute inset-0 size-5 border border-line object-cover", round ? "rounded-full" : "rounded-[5px]", loaded !== src && "invisible")}
        />
      )}
    </span>
  );
};

export const CustomImageField =
  ({ title, description, image, onImageChange, hoverText, onHoverTextChange, hoverError, imageError, upload, uploading, round, noneShowsNowly = false, listeningHint = false }: CustomImageFieldProps) => {
    const { t } = useI18n();
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const uploadHintId = useId();
    const [kept, setKept] = useState<Partial<Record<Mode, CustomImage>>>({ [image.kind]: image });
    const [mode, setMode] = useState<Mode>(image.kind);

    const switchMode = (next: Mode) => {
      setKept((current) => ({
        ...current,
        [image.kind]: image
      }));
      setMode(next);
      onImageChange(kept[next] ?? (next === "url" ? { kind: "url", url: "" } : next === "icon" ? randomIconImage() : { kind: "none" }));
    };

    const pick = async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) return;

      const read = await readImageFile(file);

      if (!read.ok) return toast(t(READ_ERRORS[read.error] ?? "custom.image.errorInvalid"), "error");

      const uploaded = await upload(read.dataUrl);
      if (uploaded) onImageChange(uploaded);
    };

    return (
      <FieldRow layout="stacked" spacing="relaxed" title={title} description={description}>
        <div className="flex flex-col gap-3">
          <Segmented<Mode>
            label={title}
            value={mode}
            onChange={switchMode}
            options={[
              {
                value: "upload",
                label: t("custom.image.modeUpload")
              },
              {
                value: "url",
                label: t("custom.image.modeUrl")
              },
              {
                value: "icon",
                label: t("custom.image.modeIcon")
              },
              {
                value: "none",
                label: t("custom.image.modeNone")
              }
            ]}
          />
          {mode === "upload" && (
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                className={cn("group size-14! overflow-hidden", round && "rounded-full!")}
                disabled={uploading}
                aria-busy={uploading}
                aria-label={image.kind === "upload" ? t("custom.image.replace") : t("custom.image.choose")}
                title={image.kind === "upload" ? t("custom.image.replace") : t("custom.image.choose")}
                aria-describedby={uploadHintId}
                onClick={() => inputRef.current?.click()}
              >
                <span className={cn("transition-opacity", image.kind !== "upload" && "group-hover:opacity-0 group-focus-visible:opacity-0")}>
                  <Preview image={image} round={round} />
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-0 flex items-center justify-center bg-ink/65 text-canvas opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                    uploading && "opacity-100!"
                  )}
                >
                  {uploading ? <Spinner className="size-5" /> : <RiPencilLine className="size-5" />}
                </span>
              </Button>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-label-md font-medium">{image.kind === "upload" ? t("custom.image.replace") : t("custom.image.choose")}</span>
                <p id={uploadHintId} className="text-label-sm text-muted">
                  {t("custom.image.uploadHint", { size: CUSTOM_IMAGE_MAX_BYTES / MB })}
                </p>
              </div>
              <input ref={inputRef} type="file" accept={CUSTOM_IMAGE_MIMES.join(",")} className="hidden" onChange={(event) => void pick(event)} />
            </div>
          )}
          {mode === "url" && (
            <div className="flex flex-col gap-1.5">
              <Input
                type="url"
                inputMode="url"
                placeholder="https://"
                leading={<UrlThumb image={image} round={round} />}
                value={image.kind === "url" ? image.url : ""}
                onChange={(event) =>
                  onImageChange({
                    kind: "url",
                    url: event.target.value
                  })
                }
                aria-label={t("custom.image.modeUrl")}
                aria-invalid={Boolean(imageError)}
              />
              <FieldError error={imageError} />
            </div>
          )}
          {mode === "icon" && image.kind === "icon" && <CustomIconPicker value={image} onChange={onImageChange} round={round} />}
          {mode === "none" && (
            <div className="flex items-center gap-3">
              {noneShowsNowly ? (
                <CustomActivityArtwork
                  source={{
                    largeImage: { kind: "none" }
                  }}
                  size={PREVIEW_SIZE}
                  rounded="rounded-md"
                  className="border border-line rounded-md"
                />
              ) : null}
              <span className="text-label-md text-muted">
                {noneShowsNowly
                  ? t("custom.image.noneLargeHint")
                  : t("custom.image.noneSmallHint")}
              </span>
            </div>
          )}
          {(mode !== "none" || noneShowsNowly) && (
            <div className="flex flex-col gap-1.5">
              <Input
                value={hoverText}
                maxLength={CUSTOM_TEXT_MAX_LENGTH}
                placeholder={t("custom.image.hoverPlaceholder")}
                aria-label={t("custom.image.hoverLabel")}
                trailing={listeningHint ? <InfoTooltip label={t("detail.information")} text={t("custom.image.listeningHint")} /> : undefined}
                onChange={(event) => onHoverTextChange(event.target.value)}
              />
              <FieldError error={hoverError} />
            </div>
          )}
        </div>
      </FieldRow>
    );
  };
