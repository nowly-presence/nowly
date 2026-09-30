"use client";

import { RiChromeFill, RiFirefoxBrowserFill } from "@remixicon/react";
import type { ButtonVariantProps } from "@nowly/ui/button-variants";
import { buttonVariants } from "@nowly/ui/button-variants";
import { cn } from "@nowly/ui/utils";

import { detectExtensionBrowser, getExtensionDownloadUrl } from "@/lib/extension-store";
import type { ExtensionBrowser } from "@/lib/extension-store";

import { useTranslations } from "next-intl";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";


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
      {browser === "firefox" ? (
        <RiFirefoxBrowserFill data-icon="inline-start" />
      ) : (
        <RiChromeFill data-icon="inline-start" />
      )}
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
