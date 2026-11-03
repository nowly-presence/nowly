"use client";

import type { SubmissionFile } from "@/features/account/lib/submission-api";
import { Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";
import { useTranslations } from "next-intl";

export const SubmissionFiles = ({ files }: {
  files: SubmissionFile[];
}) => {
  const t = useTranslations("submissionPage");
  return (
    <Card>
      <CardContent>
        <CardTitle className="text-lg">{t("files-title")}</CardTitle>
        <CardDescription className="mt-2">{t("files-description")}</CardDescription>
        <div className="mt-4 flex flex-col gap-2">
          {files.map((file) => (
            <details key={file.path} className="rounded-lg border border-border">
              <summary className="cursor-pointer break-all px-3 py-2 text-xs font-medium text-foreground">{file.path}</summary>
              <pre className="max-h-96 overflow-auto border-t border-border p-3 text-xs leading-relaxed">{file.content}</pre>
            </details>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};