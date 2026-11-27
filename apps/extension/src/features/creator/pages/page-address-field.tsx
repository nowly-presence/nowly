import { RiAddLine, RiCloseLine, RiMapPinLine } from "@remixicon/react";
import { useState } from "react";
import { useI18n } from "@/hooks/i18n-provider";
import { sendMessage } from "@/lib/messages";
import { isSiteTab, readPageAddress } from "@/lib/page-address";
import { EXTRA_PATHS_MAX } from "@nowly/presence-creator/creator-draft";
import { PATH_MAX_LENGTH } from "@nowly/presence-creator/creator-schema";
import type { CreatorMatchMode, CreatorPage } from "@nowly/presence-creator/creator-types";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/ui/input-group";
import { Select } from "@/ui/select";
import { MATCH_MODE_KEYS } from "@/features/creator/pages/page-match-label";

const MATCH_MODES: CreatorMatchMode[] = ["startsWith", "equals", "contains", "any"];

type AddressNotice = {
  tone: "info" | "error" | "success";
  text: string;
};

const NOTICE_CLASS: Record<AddressNotice["tone"], string> = {
  info: "text-primary",
  error: "text-danger",
  success: "text-success"
};

const isOneOf = <T extends string>(values: readonly T[], value: string): value is T => (values as readonly string[]).includes(value);

export const PageAddressField = ({ domain, page, onChange }: {
  domain: string;
  page: CreatorPage;
  onChange: (page: CreatorPage) => void;
}) => {
  const { t } = useI18n();
  const [notice, setNotice] = useState<AddressNotice | null>(null);
  const [addedPath, setAddedPath] = useState(false);

  const setMatch = (partial: Partial<CreatorPage["match"]>) =>
    onChange({
      ...page,
      match: { ...page.match, ...partial }
    });

  const setExtraPaths = (extraPaths: string[]) => setMatch({ extraPaths });

  const modeSelect = (bare: boolean) => (
    <Select
      bare={bare}
      aria-label={t("creator.page.matchMode")}
      value={page.match.mode}
      onChange={(value) => {
        if (isOneOf(MATCH_MODES, value)) setMatch({ mode: value });
      }}
      options={MATCH_MODES.map((mode) => ({
        value: mode,
        label: t(MATCH_MODE_KEYS[mode])
      }))}
    />
  );

  const changePath = (value: string, extraIndex?: number) => {
    const read = readPageAddress(value, domain);
    if (extraIndex === undefined) setMatch({ path: read.path });
    else setExtraPaths(page.match.extraPaths.map((path, index) => (index === extraIndex ? read.path : path)));

    if (read.status === "stripped")
      setNotice({
        tone: "info",
        text: t("creator.page.addressStripped", { path: read.path })
      });
    else if (read.status === "foreign")
      setNotice({
        tone: "error",
        text: t("creator.page.addressOtherDomain", { domain })
      });
    else setNotice(null);
  };

  const fillCurrentPath = async () => {
    const result = await sendMessage("CREATOR_EXTRACT", {
      variables: []
    });

    const url = result.ok ? result.extraction.url : result.url;

    if (!result.ok && result.error === "NO_TAB") {
      setNotice({
        tone: "error",
        text: t("creator.page.useCurrentNoTab", { domain })
      });
      return;
    }

    if (!url || !URL.canParse(url) || !isSiteTab(url, domain)) {
      setNotice({
        tone: "error",
        text: t(url ? "creator.page.useCurrentWrongSite" : "creator.page.useCurrentUnreachable", { domain })
      });
      return;
    }

    if (!result.ok) {
      setNotice({
        tone: "error",
        text: t("creator.page.useCurrentUnreachable", { domain })
      });
      return;
    }

    const path = new URL(url).pathname;
    setMatch({
      mode: page.match.mode === "any" ? "startsWith" : page.match.mode,
      path
    });
    setNotice({
      tone: "success",
      text: t("creator.page.useCurrentDone", { path })
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Field
        label={t("creator.page.address")}
        hint={
          page.match.mode === "any"
            ? t("creator.page.addressAnyHint")
            : page.match.extraPaths.length > 0
              ? t("creator.page.addressGroupHint")
              : t("creator.page.addressHint", { domain })
        }
        invalid={notice?.tone === "error"}
      >
        {page.match.mode === "any" ? (
          modeSelect(false)
        ) : (
          <div className="flex flex-col gap-2">
            <InputGroup>
              {modeSelect(true)}
              <InputGroupInput
                value={page.match.path}
                onChange={(event) => changePath(event.target.value)}
                placeholder="/watch"
                maxLength={PATH_MAX_LENGTH}
                spellCheck={false}
              />
            </InputGroup>
            {page.match.extraPaths.map((path, index) => (
              <InputGroup key={index}>
                <InputGroupAddon text className="pr-0">
                  {t("creator.page.addressOr")}
                </InputGroupAddon>
                <InputGroupInput
                  value={path}
                  onChange={(event) => changePath(event.target.value, index)}
                  placeholder="/watch"
                  maxLength={PATH_MAX_LENGTH}
                  spellCheck={false}
                  autoFocus={addedPath && index === page.match.extraPaths.length - 1}
                  aria-label={t("creator.page.address")}
                />
                <button
                  type="button"
                  className="flex w-9 shrink-0 items-center justify-center text-muted transition-colors duration-150 hover:text-ink"
                  aria-label={t("creator.page.removeAddress")}
                  onClick={() => setExtraPaths(page.match.extraPaths.filter((_, entry) => entry !== index))}
                >
                  <RiCloseLine className="size-4" />
                </button>
              </InputGroup>
            ))}
          </div>
        )}
      </Field>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {page.match.mode !== "any" && page.match.extraPaths.length < EXTRA_PATHS_MAX && (
          <Button
            variant="link"
            icon={<RiAddLine className="size-3.5" />}
            onClick={() => {
              setAddedPath(true);
              setExtraPaths([...page.match.extraPaths, ""]);
            }}
          >
            {t("creator.page.addAddress")}
          </Button>
        )}
        <Button variant="link" icon={<RiMapPinLine className="size-3.5" />} onClick={() => void fillCurrentPath()}>
          {t("creator.page.useCurrent")}
        </Button>
      </div>
      {notice && (
        <span role="status" className={`text-label-md ${NOTICE_CLASS[notice.tone]}`}>
          {notice.text}
        </span>
      )}
    </div>
  );
};