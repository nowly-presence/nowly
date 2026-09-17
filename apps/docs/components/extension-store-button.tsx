"use client";

import { RiDownloadLine } from "@remixicon/react";
import { buttonVariants } from "@/components/ui/button-variants";
import { detectExtensionBrowser, getExtensionDownloadUrl } from "@/lib/extension-store";
import type { ExtensionBrowser } from "@/lib/extension-store";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import type { ButtonVariantProps } from "@/components/ui/button-variants";

type ExtensionStoreButtonProps = Omit<ComponentProps<"a">, "href"> & ButtonVariantProps;

const useExtensionBrowser = () => {
  const [browser, setBrowser] = useState<ExtensionBrowser>("chrome");

  useEffect(() => {
    setBrowser(detectExtensionBrowser());
  }, []);

  return browser;
};

export const ExtensionStoreButton = ({
  children,
  className,
  variant,
  size,
  ...props
}: ExtensionStoreButtonProps) => {
  const t = useTranslations("store");
  const browser = useExtensionBrowser();

  return (
    <a
      href={getExtensionDownloadUrl(browser)}
      rel="noreferrer"
      target="_blank"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      <RiDownloadLine data-icon="inline-start" />
      {children ?? t(browser === "firefox" ? "download-firefox" : "download-chrome")}
    </a>
  );
};

export const ExtensionStoreLink = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  const browser = useExtensionBrowser();

  return (
    <a
      href={getExtensionDownloadUrl(browser)}
      rel="noreferrer"
      target="_blank"
      className={className}
    >
      {children}
    </a>
  );
};
