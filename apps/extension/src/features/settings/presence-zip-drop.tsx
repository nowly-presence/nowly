import { RiFileZipLine } from "@remixicon/react"
import { useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { HeadingText } from "@/components/shared/heading-text"
import { sendMessage } from "@/lib/messages"
import { t } from "@/shared/i18n"
import { bytesToBase64 } from "@/shared/zip-bytes"
import { Button } from "@/ui/button"
import { cn } from "@/ui/utils"

type Status = "idle" | "busy" | "ok" | "error"

export const PresenceZipDrop = (): React.JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [detail, setDetail] = useState("")

  const installFile = async (file: File): Promise<void> => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setStatus("error")
      setDetail(t("local-zip-invalid"))
      return
    }

    setStatus("busy")
    setDetail("")
    const bytes = new Uint8Array(await file.arrayBuffer())
    const result = await sendMessage("INSTALL_LOCAL_PRESENCE_ZIP", { fileName: file.name, bytes: bytesToBase64(bytes) })

    if (result?.ok) {
      setStatus("ok")
      setDetail(t("local-zip-ok", { slug: result.slug ?? file.name }))
      return
    }

    setStatus("error")
    if (result?.error === "UNPACKED_BUILD_ONLY") {
      setDetail(t("local-zip-unpacked-only"))
      return
    }
    setDetail(result?.error ? t("local-zip-error-detail", { error: result.error }) : t("local-zip-error"))
  }

  const onDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file) void installFile(file)
  }

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) void installFile(file)
  }

  return (
    <div>
      <HeadingText
        title={t("local-zip-title")}
        description={t("local-zip-description")}
        className="mb-2"
      />
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-xl border border-dashed px-3 py-4 text-center transition-colors",
          dragOver ? "border-accent bg-accent/10" : "border-border bg-secondary",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={onChange}
        />
        <RiFileZipLine className="mx-auto mb-2 size-5 text-muted-foreground" />
        <p className="text-xs text-foreground">{t("local-zip-drop")}</p>
        <Button
          variant="outline"
          size="sm"
          disabled={status === "busy"}
          onClick={() => inputRef.current?.click()}
          className="mt-2"
        >
          {status === "busy" ? t("local-zip-busy") : t("local-zip-browse")}
        </Button>
      </div>
      {detail ? <p className={cn("mt-2 text-xs leading-4", status === "ok" ? "text-accent" : "text-destructive")}>{detail}</p> : null}
    </div>
  )
}
