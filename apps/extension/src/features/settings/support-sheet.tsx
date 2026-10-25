import { RiBtcFill, RiCupLine, RiEthFill, RiExternalLinkLine, RiGithubLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { openUrl } from "@/shared/browser-links";
import { GITHUB_SPONSORS_URL, KOFI_URL } from "@/shared/constants";
import { Group } from "@/ui/card";
import { Row } from "@/ui/row";
import { Sheet } from "@/ui/sheet";
import { useToast } from "@/ui/toast";

const ICON_CLASS = "size-[18px] text-muted";

const SolanaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="m23.8764 18.0313-3.962 4.1393a.9201.9201 0 0 1-.306.2106.9407.9407 0 0 1-.367.0742H.4599a.4689.4689 0 0 1-.2522-.0733.4513.4513 0 0 1-.1696-.1962.4375.4375 0 0 1-.0314-.2545.4438.4438 0 0 1 .117-.2298l3.9649-4.1393a.92.92 0 0 1 .3052-.2102.9407.9407 0 0 1 .3658-.0746H23.54a.4692.4692 0 0 1 .2523.0734.4531.4531 0 0 1 .1697.196.438.438 0 0 1 .0313.2547.4442.4442 0 0 1-.1169.2297zm-3.962-8.3355a.9202.9202 0 0 0-.306-.2106.941.941 0 0 0-.367-.0742H.4599a.4687.4687 0 0 0-.2522.0734.4513.4513 0 0 0-.1696.1961.4376.4376 0 0 0-.0314.2546.444.444 0 0 0 .117.2297l3.9649 4.1394a.9204.9204 0 0 0 .3052.2102c.1154.049.24.0744.3658.0746H23.54a.469.469 0 0 0 .2523-.0734.453.453 0 0 0 .1697-.1961.4382.4382 0 0 0 .0313-.2546.4444.4444 0 0 0-.1169-.2297zM.46 6.7225h18.7815a.9411.9411 0 0 0 .367-.0742.9202.9202 0 0 0 .306-.2106l3.962-4.1394a.4442.4442 0 0 0 .117-.2297.4378.4378 0 0 0-.0314-.2546.453.453 0 0 0-.1697-.196.469.469 0 0 0-.2523-.0734H4.7596a.941.941 0 0 0-.3658.0745.9203.9203 0 0 0-.3052.2102L.1246 5.9687a.4438.4438 0 0 0-.1169.2295.4375.4375 0 0 0 .0312.2544.4512.4512 0 0 0 .1692.196.4689.4689 0 0 0 .2518.0739z" />
  </svg>
);

const WALLETS = [
  {
    name: "Bitcoin",
    address: "bc1qhjhypjtyhta50s698570qljx0v4fnc2jsphmhs",
    icon: RiBtcFill
  },
  {
    name: "Ethereum",
    address: "0x7FF4C0478f119FF474bF7Ef5F1d506a7c8f81e23",
    icon: RiEthFill
  },
  {
    name: "Solana",
    address: "GZVdTiQ9FZUt3EiGTkZT68QDui5PV1uQXektRBAfp6ZU",
    icon: SolanaIcon
  }
] as const;

export const SupportSheet = ({ open, onClose }: {
  open: boolean;
  onClose: () => void;
}) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const trailing = <RiExternalLinkLine className="size-4 text-muted" />;
  const copy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast(t("toast.copied"));
    } catch {
      toast(t("support.copyFailed"), "error");
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t("support.rowTitle")} description={t("support.sheetDescription")} closeLabel={t("action.close")}>
      <Group>
        <Row
          leading={<RiCupLine className={ICON_CLASS} />}
          title="Ko-fi"
          description={t("support.kofiHint")}
          onClick={() => openUrl(KOFI_URL)}
          trailing={trailing}
        />
        <Row
          leading={<RiGithubLine className={ICON_CLASS} />}
          title="GitHub Sponsors"
          description={t("support.sponsorsHint")}
          onClick={() => openUrl(GITHUB_SPONSORS_URL)}
          trailing={trailing}
        />
      </Group>
      <p className="px-1 pt-3 pb-2 text-label-md text-muted">{t("support.copyHint")}</p>
      <Group className="grid grid-cols-3 divide-x divide-line divide-y-0">
        {WALLETS.map(({ name, address, icon: Icon }) => (
          <button
            key={name}
            type="button"
            aria-label={t("support.copyAddress", { name })}
            title={t("support.copyAddress", { name })}
            onClick={() => void copy(address)}
            className="flex min-h-14 flex-col items-center justify-center gap-1 bg-surface text-ink transition-colors hover:bg-hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
          >
            <Icon className="size-5" aria-hidden="true" />
            <span className="text-label-sm text-muted">{name}</span>
          </button>
        ))}
      </Group>
    </Sheet>
  );
};