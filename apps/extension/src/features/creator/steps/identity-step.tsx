import { useState } from "react";
import { RiAddLine, RiCloseLine, RiGlobalLine } from "@remixicon/react";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { CATEGORIES, categoryKey } from "@/lib/presence-categories";
import { CREATOR_DEFAULT_COLOR, isValidDomain, normalizeDomain } from "@/shared/creator/creator-draft";
import type { CreatorCategory, CreatorDraft } from "@/shared/creator/creator-types";
import { urlMatchesPresence } from "@/shared/url-patterns";
import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { Field } from "@/ui/field";
import { Input } from "@/ui/input";
import { Select } from "@/ui/select";
import type { DraftUpdate } from "@/features/creator/use-draft-editor";

const isCategory = (value: string): value is CreatorCategory => (CATEGORIES as string[]).includes(value);

export const IdentityStep = ({ draft, update }: {
  draft: CreatorDraft;
  update: DraftUpdate;
}) => {
  const { t } = useI18n();
  const { state } = useExtensionState();
  const [domainInput, setDomainInput] = useState("");
  const currentHost = state.tab.hostname;
  const suggestHost =
    currentHost && !state.catalog.items.some((item) => urlMatchesPresence(`https://${currentHost}/`, item.url)) ? normalizeDomain(currentHost) : null;

  const addDomain = (value: string) => {
    const domain = normalizeDomain(value);

    if (!domain || draft.domains.includes(domain)) return setDomainInput("");

    update((current) => ({
      ...current,
      domains: [...current.domains, domain]
    }));
    setDomainInput("");
  };

  return (
    <div className="flex flex-col gap-6">
      <Field label={t("creator.identity.name")} hint={t("creator.identity.nameHint")}>
        <Input
          value={draft.name}
          onChange={(event) => update({ name: event.target.value })}
          placeholder={t("creator.identity.namePlaceholder")}
          maxLength={40}
        />
      </Field>

      <Field label={t("creator.identity.domains")} hint={t("creator.identity.domainsHint")}>
        {draft.domains.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {draft.domains.map((domain) => (
              <Chip
                key={domain}
                active={isValidDomain(domain)}
                icon={<RiCloseLine className="size-3.5" />}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    domains: current.domains.filter((value) => value !== domain)
                  }))
                }
                aria-label={t("creator.identity.removeDomain", { domain })}
              >
                {domain}
              </Chip>
            ))}
          </div>
        )}
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addDomain(domainInput);
          }}
        >
          <div className="flex-1">
            <Input value={domainInput} onChange={(event) => setDomainInput(event.target.value)} placeholder="example.com" spellCheck={false} />
          </div>
          <Button type="submit" variant="secondary" icon={<RiAddLine className="size-4" />} disabled={!domainInput.trim()}>
            {t("creator.identity.addDomain")}
          </Button>
        </form>
        {suggestHost && !draft.domains.includes(suggestHost) && (
          <Button variant="link" className="self-start" icon={<RiGlobalLine className="size-3.5" />} onClick={() => addDomain(suggestHost)}>
            {t("creator.identity.useCurrent", { domain: suggestHost })}
          </Button>
        )}
      </Field>

      <Field label={t("creator.identity.color")} hint={t("creator.identity.colorHint")}>
        <div className="flex items-center gap-2">
          <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-line" style={{ backgroundColor: draft.color }}>
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(draft.color) ? draft.color : "#000000"}
              onChange={(event) => update({ color: event.target.value })}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label={t("creator.identity.color")}
            />
          </label>
          <div className="w-32">
            <Input
              value={draft.color}
              onChange={(event) => update({ color: event.target.value.trim() })}
              placeholder={CREATOR_DEFAULT_COLOR}
              spellCheck={false}
              maxLength={7}
            />
          </div>
        </div>
      </Field>

      <Field label={t("creator.identity.category")}>
        <Select
          aria-label={t("creator.identity.category")}
          value={draft.category}
          onChange={(value) => {
            if (isCategory(value)) update({ category: value });
          }}
          options={CATEGORIES.map((value) => ({
            value,
            label: t(categoryKey(value))
          }))}
        />
      </Field>
    </div>
  );
};