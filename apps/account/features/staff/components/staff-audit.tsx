"use client";

import { StaffAuditFeed } from "@/features/staff/components/staff-audit-feed";
import { PageHeader } from "@/features/shell/components/page-header";
import { useTranslations } from "next-intl";

export const StaffAudit = () => {
  const t = useTranslations("staff");
  return (
    <>
      <PageHeader title={t("audit-title")} description={t("audit-description")} />
      <StaffAuditFeed paged />
    </>
  );
};
