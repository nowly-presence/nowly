import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { Button } from "@/ui/button";

type LibraryPaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export const LibraryPagination = ({ page, pageCount, onPageChange }: LibraryPaginationProps) => {
  const { t } = useI18n();

  return (
    <nav className="flex items-center justify-between gap-3 px-1" aria-label={t("library.pagination")}>
      <Button variant="secondary" size="sm" icon={<RiArrowLeftSLine className="size-4" />} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        {t("library.pagePrevious")}
      </Button>
      <span className="text-label-md text-muted">
        {t("library.pageOf", {
          page,
          total: pageCount
        })}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        {t("library.pageNext")}
        <RiArrowRightSLine className="size-4" />
      </Button>
    </nav>
  );
};