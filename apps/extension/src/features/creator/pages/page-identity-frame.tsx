import { RiEyeLine, RiGamepadLine, RiHeadphoneLine, RiMapPinLine, RiTrophyLine } from "@remixicon/react";
import { useState, type ReactNode } from "react";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { sendMessage } from "@/lib/messages";
import { isSiteTab, readPageAddress } from "@/lib/page-address";
import type { CreatorActivityType, CreatorDraft, CreatorMatchMode, CreatorPage } from "@nowly/presence-creator/creator-types";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Frame } from "@/ui/frame";
import { Input } from "@/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/ui/input-group";
import { OptionCards } from "@/ui/option-cards";
import { Select } from "@/ui/select";
import { MATCH_MODE_KEYS } from "@/features/creator/pages/page-match-label";

const ACTIVITY_TYPES: CreatorActivityType[] = ["watching", "listening", "playing", "competing"];
const ACTIVITY_META: Record<
  CreatorActivityType,
  {
    label: MessageKey;
    hint: MessageKey;
    icon: ReactNode;
  }
> = {
  watching: {
    label: "activity.type.watching",
    hint: "creator.page.activityWatching",
    icon: <RiEyeLine />
  },
  listening: {
    label: "activity.type.listening",
    hint: "creator.page.activityListening",
    icon: <RiHeadphoneLine />
  },
  playing: {
    label: "activity.type.playing",
    hint: "creator.page.activityPlaying",
    icon: <RiGamepadLine />
  },
  competing: {
    label: "activity.type.competing",
    hint: "creator.page.activityCompeting",
    icon: <RiTrophyLine />
  }
};
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

export const PageIdentityFrame = ({ draft, page, onChange }: {
  draft: CreatorDraft;
  page: CreatorPage;
  onChange: (page: CreatorPage) => void;
}) => {
  const { t } = useI18n();
  const set = (partial: Partial<CreatorPage>) => onChange({ ...page, ...partial });
  const domain = draft.domains[0] ?? "example.com";
  const modeSelect = (bare: boolean) => (
    <Select
      bare={bare}
      aria-label={t("creator.page.matchMode")}
      value={page.match.mode}
      onChange={(value) => {
        if (isOneOf(MATCH_MODES, value)) set({
          match: {
            ...page.match,
            mode: value
          }
        });
      }}
      options={MATCH_MODES.map((mode) => ({
        value: mode,
        label: t(MATCH_MODE_KEYS[mode])
      }))}
    />
  );

  const [notice, setNotice] = useState<AddressNotice | null>(null);

  const changePath = (value: string) => {
    const read = readPageAddress(value, domain);
    set({
      match: {
        ...page.match,
        path: read.path
      }
    });

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
    set({
      match: {
        mode: page.match.mode === "any" ? "startsWith" : page.match.mode,
        path
      }
    });
    setNotice({
      tone: "success",
      text: t("creator.page.useCurrentDone", { path })
    });
  };

  return (
    <Frame title={t("creator.page.frameTitle")} description={t("creator.page.frameDescription")}>
      <Field label={t("creator.page.name")}>
        <Input value={page.name} onChange={(event) => set({ name: event.target.value })} placeholder={t("creator.page.namePlaceholder")} maxLength={40} />
      </Field>

      <div className="flex flex-col gap-2">
        <Field
          label={t("creator.page.address")}
          hint={
            page.match.mode === "any"
              ? t("creator.page.addressAnyHint")
              : t("creator.page.addressHint", { domain })
          }
          invalid={notice?.tone === "error"}
        >
          {page.match.mode === "any" ? (
            modeSelect(false)
          ) : (
            <InputGroup>
              <div className="flex shrink-0">{modeSelect(true)}</div>
              <InputGroupAddon text className="min-w-0 max-w-[35%] pr-0">
                <span className="truncate">{domain}</span>
              </InputGroupAddon>
              <InputGroupInput
                className="min-w-24 pl-0.5"
                value={page.match.path}
                onChange={(event) => changePath(event.target.value)}
                placeholder="/watch"
                spellCheck={false}
              />
            </InputGroup>
          )}
        </Field>
        <Button variant="link" className="self-start" icon={<RiMapPinLine className="size-3.5" />} onClick={() => void fillCurrentPath()}>
          {t("creator.page.useCurrent")}
        </Button>
        {notice && (
          <span role="status" className={`text-label-md ${NOTICE_CLASS[notice.tone]}`}>
            {notice.text}
          </span>
        )}
      </div>

      <Field label={t("creator.page.activityType")}>
        <OptionCards<CreatorActivityType>
          label={t("creator.page.activityType")}
          value={page.activityType}
          onValueChange={(value) => set({ activityType: value })}
          options={ACTIVITY_TYPES.map((value) => ({
            value,
            label: t(ACTIVITY_META[value].label),
            description: t(ACTIVITY_META[value].hint),
            icon: ACTIVITY_META[value].icon
          }))}
        />
      </Field>
    </Frame>
  );
};