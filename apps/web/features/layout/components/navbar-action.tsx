"use client";

import { ExtensionStoreButton } from "@/components/extension-store-button";
import { useExtensionDetected } from "@/hooks/use-extension";
import { buttonVariants } from "@nowly/ui/button-variants";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

export const NavbarAction = (props: ComponentProps<typeof ExtensionStoreButton>) => {
  const t = useTranslations("store");
  const detected = useExtensionDetected();

  if (detected === null) return null;

  if (detected) return (
    <a href="/account" className={buttonVariants({ variant: props.variant })}>
      {t("my-account")}
    </a>
  );

  return <ExtensionStoreButton {...props} />;
};