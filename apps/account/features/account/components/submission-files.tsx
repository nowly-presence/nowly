"use client";

import { Frame } from "@/features/shell/components/frame";
import type { SubmissionFile } from "@/features/account/lib/submission-api";
import { useTranslations } from "next-intl";

export const SubmissionFiles = ({ files }: {
  files: SubmissionFile[];
}) => {
  const t = useTranslations("submissionPage");
  return (
    <Frame title={t("files-title")} description={t("files-description")}>
      <div className="flex flex-col gap-2">
        {files.map((file) => (
          <details key={file.path} className="rounded-lg border border-border">
            <summary className="cursor-pointer break-all px-3 py-2 text-xs font-medium text-foreground">{file.path}</summary>
            <pre className="max-h-96 overflow-auto border-t border-border p-3 text-xs leading-relaxed">{file.content}</pre>
          </details>
        ))}
      </div>
    </Frame>
  );
};