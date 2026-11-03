import { useMemo, useState } from "react";
import { RiArrowDownSLine, RiDownloadLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { codeLanguageOf, highlightCode } from "@/lib/highlight";
import { presenceFolder, presenceSlug } from "@/shared/creator/creator-draft";
import { buildCreatorZip, buildTextFiles } from "@/shared/creator/creator-export";
import type { CreatorDraft } from "@/shared/creator/creator-types";
import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { CodeBlock } from "@/ui/code-block";

const downloadZip = (draft: CreatorDraft) => {
  const bytes = buildCreatorZip(draft);
  const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: "application/zip" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${presenceSlug(draft.name) || "presence"}.zip`;
  link.click();
  URL.revokeObjectURL(url);
};

export const GeneratedFiles = ({ draft, blocked }: {
  draft: CreatorDraft;
  blocked: boolean;
}) => {
  const { t } = useI18n();
  const files = useMemo(() => buildTextFiles(draft), [draft]);
  const [selected, setSelected] = useState(0);
  const file = files[Math.min(selected, files.length - 1)];
  const folder = `${presenceFolder(draft.name)}/`;

  return (
    <details className="group rounded-sm border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-label-lg font-medium">{t("creator.review.files")}</span>
          <span className="text-label-md text-muted">{t("creator.review.filesHint")}</span>
        </span>
        <RiArrowDownSLine className="size-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-3 border-t border-line p-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("creator.review.files")}>
          {files.map((entry, index) => (
            <Chip
              key={entry.path}
              role="tab"
              aria-selected={index === selected}
              active={index === selected}
              onClick={() => setSelected(index)}
              className="font-mono text-label-sm"
            >
              {entry.path.replace(folder, "")}
            </Chip>
          ))}
        </div>
        {file && <CodeBlock title={file.path.replace(folder, "")} tokens={highlightCode(file.content, codeLanguageOf(file.path))} />}
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          icon={<RiDownloadLine className="size-4" />}
          disabled={blocked}
          onClick={() => downloadZip(draft)}
        >
          {t("creator.review.export")}
        </Button>
      </div>
    </details>
  );
};