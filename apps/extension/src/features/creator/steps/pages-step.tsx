import { RiAddLine, RiDeleteBinLine, RiPagesLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { createPage } from "@nowly/presence-creator/creator-draft";
import type { CreatorDraft, CreatorPage } from "@nowly/presence-creator/creator-types";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { EmptyState } from "@/ui/empty-state";
import { SwitchRow } from "@/ui/row";
import { SortableList } from "@/ui/sortable-list";
import { PageEditor } from "@/features/creator/pages/page-editor";
import { useMatchLabel } from "@/features/creator/pages/page-match-label";
import type { DraftUpdate } from "@/features/creator/use-draft-editor";

type PagesStepProps = {
  draft: CreatorDraft;
  update: DraftUpdate;
  editingId: string | null;
  onEdit: (id: string | null) => void;
};

export const PagesStep = ({ draft, update, editingId, onEdit }: PagesStepProps) => {
  const { t } = useI18n();
  const matchLabel = useMatchLabel();
  const editing = draft.pages.find((page) => page.id === editingId);
  const siteName = draft.name.trim() || t("creator.untitled");

  const setPage = (page: CreatorPage) =>
    update((current) => ({
      ...current,
      pages: current.pages.map((item) => (item.id === page.id ? page : item))
    }));

  const addPage = () => {
    const page = createPage(t("creator.pages.defaultName", { index: draft.pages.length + 1 }));
    update((current) => ({
      ...current,
      pages: [...current.pages, page]
    }));
    onEdit(page.id);
  };

  if (editing) return <PageEditor draft={draft} page={editing} onChange={setPage} />;

  return (
    <div className="flex flex-col gap-4">
      {draft.pages.length === 0 ? (
        <Group>
          <EmptyState
            icon={<RiPagesLine className="size-5" />}
            title={t("creator.pages.emptyTitle")}
            description={t("creator.pages.emptyDescription")}
            action={
              <Button icon={<RiAddLine className="size-4" />} onClick={addPage}>
                {t("creator.pages.add")}
              </Button>
            }
          />
        </Group>
      ) : (
        <SortableList
          items={draft.pages}
          getKey={(page) => page.id}
          label={t("creator.pages.listLabel")}
          itemLabel={(page) => page.name || t("creator.untitled")}
          onReorder={(pages) => update({ pages })}
          onActivate={(page) => onEdit(page.id)}
          renderItem={(page) => (
            <>
              <span className="flex min-w-0 flex-1 flex-col py-1">
                <span className="truncate text-label-lg font-medium">{page.name || t("creator.untitled")}</span>
                <span className="truncate text-label-md text-muted">
                  {t("creator.pages.summary", {
                    match: matchLabel(page),
                    count: page.variables.length
                  })}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("creator.pages.delete", { name: page.name || t("creator.untitled") })}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    pages: current.pages.filter((item) => item.id !== page.id)
                  }))
                }
              >
                <RiDeleteBinLine className="size-4" />
              </Button>
            </>
          )}
        />
      )}
      {draft.pages.length > 0 && (
        <Button variant="secondary" icon={<RiAddLine className="size-4" />} onClick={addPage}>
          {t("creator.pages.add")}
        </Button>
      )}
      {draft.pages.length > 1 && <p className="px-1 text-label-md text-muted">{t("creator.pages.orderHint")}</p>}
      <Group>
        <SwitchRow
          title={t("creator.pages.browsing")}
          description={t("creator.pages.browsingHint", { name: siteName })}
          checked={draft.browsingFallback}
          label={t("creator.pages.browsing")}
          onChange={(checked) => update({ browsingFallback: checked })}
        />
      </Group>
    </div>
  );
};