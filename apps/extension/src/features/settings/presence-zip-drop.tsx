import { Button } from "@/components/ui/button";
import { sendMessage } from "@/lib/messages";
import { bytesToBase64 } from "@/shared/zip-bytes";
import { t } from "@/shared/i18n";
import { IconFileZip } from "@/lib/tabler-icons";
import type { ChangeEvent, DragEvent, FC, ReactElement } from "react";
import { useRef, useState } from "react";

type Status = "idle" | "busy" | "ok" | "error";

export const PresenceZipDrop: FC = (): ReactElement => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [detail, setDetail] = useState("");

  const installFile = async (file: File): Promise<void> => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setStatus("error");
      setDetail(t("local-zip-invalid"));
      return;
    }

    setStatus("busy");
    setDetail("");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await sendMessage<{ ok?: boolean; error?: string; slug?: string }>(
      "INSTALL_LOCAL_PRESENCE_ZIP",
      { fileName: file.name, bytes: bytesToBase64(bytes) },
    );

    if (result?.ok) {
      setStatus("ok");
      setDetail(t("local-zip-ok", { slug: result.slug ?? file.name }));
      return;
    }

    setStatus("error");
    setDetail(result?.error ? t("local-zip-error-detail", { error: result.error }) : t("local-zip-error"));
  };

  const onDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) void installFile(file);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void installFile(file);
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="font-semibold text-foreground">{t("local-zip-title")}</p>
      <p className="mb-2 text-[10px] leading-4 text-dim-foreground">{t("local-zip-description")}</p>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-xl border border-dashed px-3 py-4 text-center transition-colors ${
          dragOver ? "border-accent bg-accent/10" : "border-border bg-card-2"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={onChange}
        />
        <IconFileZip className="mx-auto mb-2 size-5 text-muted-foreground" />
        <p className="text-[11px] text-foreground">{t("local-zip-drop")}</p>
        <Button
          variant="unstyled"
          size="none"
          disabled={status === "busy"}
          onClick={() => inputRef.current?.click()}
          className="mt-2 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground disabled:opacity-50"
        >
          {status === "busy" ? t("local-zip-busy") : t("local-zip-browse")}
        </Button>
      </div>
      {detail ? (
        <p className={`mt-2 text-[10px] leading-4 ${status === "ok" ? "text-accent" : "text-red-400"}`}>
          {detail}
        </p>
      ) : null}
    </div>
  );
};
