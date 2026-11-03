import { RiMapPinLine } from "@remixicon/react";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { sendMessage } from "@/lib/messages";
import { isImageVariable } from "@/shared/creator/creator-activity";
import type { CreatorActivityType, CreatorDraft, CreatorImage, CreatorMatchMode, CreatorPage, CreatorTimestamps } from "@/shared/creator/creator-types";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Input } from "@/ui/input";
import { InputGroup, InputGroupInput } from "@/ui/input-group";
import { Select } from "@/ui/select";
import { MATCH_MODE_KEYS } from "@/features/creator/pages/page-match-label";
import { PagePreview } from "@/features/creator/pages/page-preview";
import { PageTexts } from "@/features/creator/pages/page-texts";
import { PageVariables } from "@/features/creator/pages/page-variables";
import { UrlSourceField, type UrlSource } from "@/features/creator/pages/url-source-field";

const ACTIVITY_TYPES: CreatorActivityType[] = ["watching", "listening", "playing", "competing"];
const ACTIVITY_KEYS: Record<
  CreatorActivityType,
  {
    label: MessageKey;
    hint: MessageKey;
  }
> = {
  watching: {
    label: "activity.type.watching",
    hint: "creator.page.activityWatching"
  },
  listening: {
    label: "activity.type.listening",
    hint: "creator.page.activityListening"
  },
  playing: {
    label: "activity.type.playing",
    hint: "creator.page.activityPlaying"
  },
  competing: {
    label: "activity.type.competing",
    hint: "creator.page.activityCompeting"
  }
};
const MATCH_MODES: CreatorMatchMode[] = ["startsWith", "equals", "contains", "any"];
const TIMESTAMPS: CreatorTimestamps[] = ["elapsed", "media"];
const TIMESTAMP_KEYS: Record<
  CreatorTimestamps,
  {
    label: MessageKey;
    hint: MessageKey;
  }
> = {
  elapsed: {
    label: "creator.page.timestampsElapsed",
    hint: "creator.page.timestampsElapsedHint"
  },
  media: {
    label: "creator.page.timestampsMedia",
    hint: "creator.page.timestampsMediaHint"
  }
};

const isOneOf = <T extends string>(values: readonly T[], value: string): value is T => (values as readonly string[]).includes(value);

const toUrlSource = (image: CreatorImage): UrlSource => (image.kind === "logo" ? { kind: "default" } : image);

const toImage = (source: UrlSource): CreatorImage => (source.kind === "default" ? { kind: "logo" } : source);

type PageEditorProps = {
  draft: CreatorDraft;
  page: CreatorPage;
  onChange: (page: CreatorPage) => void;
};

export const PageEditor = ({ draft, page, onChange }: PageEditorProps) => {
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

  const fillCurrentPath = async () => {
    const result = await sendMessage("CREATOR_EXTRACT", {
      variables: []
    });

    const url = result.ok ? result.extraction.url : result.url;
    if (url && URL.canParse(url)) set({
      match: {
        mode: page.match.mode === "any" ? "startsWith" : page.match.mode,
        path: new URL(url).pathname
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Field label={t("creator.page.name")} hint={t("creator.page.nameHint")}>
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
        >
          {page.match.mode === "any" ? (
            modeSelect(false)
          ) : (
            <InputGroup>
              {modeSelect(true)}
              <InputGroupInput
                value={page.match.path}
                onChange={(event) =>
                  set({
                    match: {
                      ...page.match,
                      path: event.target.value
                    }
                  })
                }
                placeholder="/watch"
                spellCheck={false}
              />
            </InputGroup>
          )}
        </Field>
        <Button variant="link" className="self-start" icon={<RiMapPinLine className="size-3.5" />} onClick={() => void fillCurrentPath()}>
          {t("creator.page.useCurrent")}
        </Button>
      </div>

      <Field label={t("creator.page.activityType")} hint={t("creator.page.activityTypeHint")}>
        <Select
          aria-label={t("creator.page.activityType")}
          value={page.activityType}
          onChange={(value) => {
            if (isOneOf(ACTIVITY_TYPES, value)) set({ activityType: value });
          }}
          options={ACTIVITY_TYPES.map((value) => ({
            value,
            label: t(ACTIVITY_KEYS[value].label),
            hint: t(ACTIVITY_KEYS[value].hint)
          }))}
        />
      </Field>

      <PageVariables page={page} onChange={onChange} />
      <PageTexts draft={draft} page={page} onChange={onChange} />

      <UrlSourceField
        read="image"
        label={t("creator.page.image")}
        hint={t("creator.page.imageHint")}
        defaultLabel={t("creator.page.imageLogo")}
        value={toUrlSource(page.largeImage)}
        page={page}
        candidates={page.variables.filter(isImageVariable)}
        onChange={(next, source) =>
          onChange({
            ...next,
            largeImage: toImage(source)
          })
        }
      />

      <Field label={t("creator.page.timestamps")} hint={t("creator.page.timestampsHint")}>
        <Select
          aria-label={t("creator.page.timestamps")}
          value={page.timestamps}
          onChange={(value) => {
            if (isOneOf(TIMESTAMPS, value)) set({ timestamps: value });
          }}
          options={TIMESTAMPS.map((value) => ({
            value,
            label: t(TIMESTAMP_KEYS[value].label),
            hint: t(TIMESTAMP_KEYS[value].hint)
          }))}
        />
      </Field>

      <PagePreview draft={draft} page={page} />
    </div>
  );
};