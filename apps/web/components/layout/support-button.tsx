"use client";

import { SponsorModal } from "@/components/l-ui/sponsor-modal";
import { Button } from "@/components/ui/button";
import { IconHeartHandshake } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import { useState } from "react";

export const SupportButton: FC = () => {
  const t = useTranslations("footer");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSupport = (): void => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleSupport}
        size="sm"
        variant="secondary"
        className="text-muted-foreground text-xs sm:text-sm px-2 sm:px-3 hover:border-accent/40 hover:text-foreground hover:bg-accent/5"
      >
        <IconHeartHandshake className="w-3.5 h-3.5 text-accent" />
        <span>{t("support")}</span>
      </Button>

      <SponsorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
