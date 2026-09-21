"use client";

import { ExtensionStoreButton } from "@/components/extension-store-button";
import { PresenceLikeButton } from "@/components/library/presence-like-button";
import { PresenceReportDialog } from "@/components/library/presence-report-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, Button, Spinner, toast } from "@nowly/ui";
import { usePresenceExtension } from "@/hooks/use-extension";
import { trackPublicAnalytics } from "@/lib/analytics";
import { RiCheckboxCircleLine, RiDeleteBinLine, RiDownloadLine, RiRefreshLine } from "@nowly/ui/icons";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

type PresenceActionsProps = {
  slug: string
  name: string
  version: string | null
  likeCount: number
};

export const PresenceActions = ({ slug, name, version, likeCount }: PresenceActionsProps) => {
  const t = useTranslations("presencePage");
  const locale = useLocale();
  const {
    bridgeBlocked,
    busy,
    catalogReady,
    detected,
    diagnostic,
    install,
    isInstalled,
    mobile,
    needsUpdate,
    uninstall,
  } = usePresenceExtension(slug, version);
  const [confirmUninstall, setConfirmUninstall] = useState(false);

  const onInstall = async () => {
    trackPublicAnalytics("marketplace_install_click", { slug, source: "web_library", payload: { locale } });
    const result = await install();
    if (result === "ok") {
      trackPublicAnalytics("marketplace_conversion", { slug, source: "web_library", payload: { locale } });
      toast.success(t(needsUpdate ? "update-success" : "install-success", { name }));
    } else if (result === "queued") toast.success(t("install-queued", { name }));
    else if (result === "blocked") toast.error(t("install-origin"));
    else toast.error(t("install-error", { name }));
  };

  const onUninstall = async () => {
    setConfirmUninstall(false);
    const ok = await uninstall();
    if (ok) toast.success(t("uninstall-success", { name }));
    else toast.error(t("uninstall-error", { name }));
  };

  const checking = detected === null || (detected === true && !catalogReady);

  return (
    <div className="mt-8 flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {checking ? (
          <Button type="button" size="lg" disabled>
            <Spinner data-icon="inline-start" />
            {t("checking")}
          </Button>
        ) : null}

        {!checking && !detected ? (
          <ExtensionStoreButton size="lg">{t("cta")}</ExtensionStoreButton>
        ) : null}

        {!checking && detected && (!isInstalled || needsUpdate) ? (
          <Button type="button" size="lg" disabled={busy || mobile || bridgeBlocked} onClick={() => void onInstall()}>
            {busy ? (
              <Spinner data-icon="inline-start" />
            ) : needsUpdate ? (
              <RiRefreshLine data-icon="inline-start" />
            ) : (
              <RiDownloadLine data-icon="inline-start" />
            )}
            {busy ? t("installing") : needsUpdate ? t("update") : t("install")}
          </Button>
        ) : null}

        {!checking && detected && !bridgeBlocked && isInstalled && !needsUpdate ? (
          <Button type="button" size="lg" variant="outline" disabled>
            <RiCheckboxCircleLine data-icon="inline-start" />
            {t("installed")}
          </Button>
        ) : null}

        {!checking && detected && !bridgeBlocked && isInstalled ? (
          <Button
            type="button"
            size="lg"
            variant="destructive"
            disabled={busy}
            onClick={() => setConfirmUninstall(true)}
          >
            <RiDeleteBinLine data-icon="inline-start" />
            {t("uninstall")}
          </Button>
        ) : null}

        <PresenceReportDialog slug={slug} name={name} disabled={checking || !detected} />
        <PresenceLikeButton slug={slug} initialCount={likeCount} disabled={checking || !detected} />
      </div>

      {!checking && !detected ? (
        <p className="text-sm text-muted-foreground">{t("ext-missing")}</p>
      ) : null}
      {detected && mobile ? (
        <p className="text-sm text-muted-foreground">{t("mobile")}</p>
      ) : null}
      {detected && diagnostic && diagnostic.userScriptsActive === false ? (
        <p className="text-sm text-muted-foreground">{t("user-scripts")}</p>
      ) : null}
      {!checking && detected && bridgeBlocked ? (
        <p className="text-sm text-muted-foreground">{t("install-origin")}</p>
      ) : null}

      <AlertDialog open={confirmUninstall} onOpenChange={setConfirmUninstall}>
        <AlertDialogContent className="gap-0 overflow-hidden rounded-2xl p-0 data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
          <AlertDialogHeader className="grid-rows-none place-items-center gap-3 px-6 pt-7 pb-4 text-center sm:place-items-center sm:text-center">
            <AlertDialogMedia className="mb-0 size-12 rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive sm:row-span-1">
              <RiDeleteBinLine className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle className="sm:col-start-auto">{t("uninstall-title")}</AlertDialogTitle>
            <AlertDialogDescription className="max-w-[320px] text-pretty leading-6">
              {t("uninstall-description", { name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-0 mb-0 flex flex-col gap-2 border-0 bg-transparent p-0 px-6 pt-2 pb-6 sm:flex-col sm:justify-stretch">
            <AlertDialogAction
              variant="destructive"
              className="h-11 w-full rounded-xl"
              onClick={() => void onUninstall()}
            >
              {t("uninstall-confirm")}
            </AlertDialogAction>
            <AlertDialogCancel variant="ghost" className="h-10 w-full rounded-xl text-muted-foreground">
              {t("uninstall-cancel")}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
