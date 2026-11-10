"use client";

import { RiChromeFill, RiFirefoxBrowserFill } from "@remixicon/react";
import type { ButtonVariantProps } from "@nowly/ui/button-variants";
import { buttonVariants } from "@nowly/ui/button-variants";
import { cn } from "@nowly/ui/utils";
import { detectExtensionBrowser, getExtensionDownloadUrl, type ExtensionBrowser } from "@nowly/env/client/extension-store";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ComponentProps } from "react";
import { trackProduct } from "@/lib/telemetry";

type ExtensionStoreButtonProps = Omit<ComponentProps<"a">, "href"> & ButtonVariantProps;

const useExtensionBrowser = () => {
  const [browser, setBrowser] = useState<ExtensionBrowser>("chrome");

  useEffect(() => {
    setBrowser(detectExtensionBrowser());
  }, []);

  return browser;
};

export const ExtensionStoreButton = ({ children, className, variant, size, onClick, ...props }: ExtensionStoreButtonProps) => {
  const t = useTranslations("store");
  const browser = useExtensionBrowser();

  return (
    <a
      href={getExtensionDownloadUrl(browser)}
      rel="noreferrer"
      target="_blank"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) trackProduct({
          name: "extension_download_click",
          source: "web",
          data: { browser }
        });
      }}
    >
      {browser === "firefox" ? <RiFirefoxBrowserFill data-icon="inline-start" /> : <RiChromeFill data-icon="inline-start" />}
      {children ?? t(browser === "firefox" ? "download-firefox" : "download-chrome")}
    </a>
  );
};