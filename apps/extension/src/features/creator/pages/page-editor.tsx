import type { CreatorDraft, CreatorPage } from "@nowly/presence-creator/creator-types";
import { PageButtons } from "@/features/creator/pages/page-buttons";
import { PageIdentityFrame } from "@/features/creator/pages/page-identity-frame";
import { PageImageFrame } from "@/features/creator/pages/page-image-frame";
import { PagePreview } from "@/features/creator/pages/page-preview";
import { PageTexts } from "@/features/creator/pages/page-texts";
import { PageTimestampsFrame } from "@/features/creator/pages/page-timestamps-frame";
import { PageVariables } from "@/features/creator/pages/page-variables";

type PageEditorProps = {
  draft: CreatorDraft;
  page: CreatorPage;
  onChange: (page: CreatorPage) => void;
};

export const PageEditor = ({ draft, page, onChange }: PageEditorProps) => (
  <div className="flex flex-col gap-4">
    <PageIdentityFrame draft={draft} page={page} onChange={onChange} />
    <PageVariables page={page} onChange={onChange} />
    <PageTexts draft={draft} page={page} onChange={onChange} />
    <PageImageFrame page={page} onChange={onChange} />
    <PageButtons draft={draft} page={page} onChange={onChange} />
    <PageTimestampsFrame page={page} onChange={onChange} />
    <PagePreview draft={draft} page={page} />
  </div>
);