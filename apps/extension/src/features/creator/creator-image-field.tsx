import { useRef, useState, type DragEvent } from "react";
import { RiCheckLine, RiCloseLine, RiErrorWarningLine, RiImageAddLine, RiRefreshLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { Card } from "@/ui/card";
import { cn } from "@/ui/cn";
import { ACCEPTED_IMAGE_TYPES, ASSET_SPECS, isCreatorImageError, processAsset, type CreatorAssetKind, type ProcessedAsset } from "@/features/creator/creator-image";

type CreatorImageFieldProps = {
  kind: CreatorAssetKind;
  title: string;
  requirement: string;
  value?: string;
  background?: string;
  warning?: string;
  onChange: (asset: ProcessedAsset | null) => void;
};

const CHECKERBOARD = "repeating-conic-gradient(var(--color-hover) 0% 25%, var(--color-surface) 0% 50%) 50% / 16px 16px";

export const CreatorImageField = ({ kind, title, requirement, value, background, warning, onChange }: CreatorImageFieldProps) => {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upscaled, setUpscaled] = useState(false);
  const [dragging, setDragging] = useState(false);
  const spec = ASSET_SPECS[kind];
  const square = kind !== "thumbnail";

  const handle = async (file: File | undefined) => {
    if (!file) return;

    setBusy(true);
    setError(null);

    try {
      const asset = await processAsset(file, kind);
      setUpscaled(asset.upscaled);
      onChange(asset);
    } catch (caught) {
      setError(
        isCreatorImageError(caught, "TOO_LARGE")
          ? t("creator.visuals.tooLarge")
          : t("creator.visuals.unreadable")
      );
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void handle(event.dataTransfer.files[0]);
  };

  return (
    <Card
      className={cn("flex flex-col gap-3 p-4 transition-colors", dragging && "border-primary")}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-label-lg font-medium">{title}</span>
          <span
            title={
              value
                ? t("creator.visuals.resized", {
                    width: spec.width,
                    height: spec.height
                  })
                : undefined
            }
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-label-sm tabular-nums",
              value && !error ? "bg-success-soft text-success" : "bg-hover text-muted"
            )}
          >
            {value && !error && <RiCheckLine className="size-3.5" aria-hidden />}
            {spec.width} × {spec.height}
          </span>
        </div>
        <span className="text-label-md text-muted">{requirement}</span>
      </div>
      <div className={cn("group relative overflow-hidden rounded-md", square ? "aspect-square w-full max-w-36 self-center" : "aspect-video w-full")}>
        <button
          type="button"
          aria-label={
            value
              ? t("creator.visuals.replaceNamed", { name: title })
              : t("creator.visuals.chooseNamed", { name: title })
          }
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex size-full items-center justify-center rounded-md border border-dashed transition-colors",
            value ? "border-transparent" : "border-line-strong hover:border-primary"
          )}
          style={{ background: value && kind === "icon" ? (background ?? CHECKERBOARD) : undefined }}
        >
          {value ? (
            <>
              <img src={value} alt="" className={cn("size-full", kind === "icon" ? "object-contain p-3" : "object-cover")} />
              <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-overlay/0 text-label-md font-medium text-white opacity-0 transition-[opacity,background-color] duration-150 group-hover:bg-overlay/55 group-hover:opacity-100">
                <RiRefreshLine className="size-4" />
                {busy ? t("creator.visuals.processing") : t("creator.visuals.replace")}
              </span>
            </>
          ) : (
            <span className="flex flex-col items-center gap-1.5 p-4 text-label-md text-muted">
              <RiImageAddLine className="size-6" />
              {busy ? t("creator.visuals.processing") : t("creator.visuals.drop")}
            </span>
          )}
        </button>
        {value && (
          <button
            type="button"
            aria-label={t("creator.visuals.removeNamed", { name: title })}
            title={t("creator.visuals.remove")}
            onClick={() => onChange(null)}
            className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-canvas/90 text-ink shadow-sm backdrop-blur-sm transition-colors hover:text-danger"
          >
            <RiCloseLine className="size-4" />
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPTED_IMAGE_TYPES} className="hidden" onChange={(event) => void handle(event.target.files?.[0])} />
      {[error, value && upscaled ? t("creator.visuals.upscaled") : null, value ? warning : null].filter(Boolean).map((message) => (
        <span key={message} className="flex items-start gap-1.5 text-label-md text-danger">
          <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" />
          {message}
        </span>
      ))}
    </Card>
  );
};