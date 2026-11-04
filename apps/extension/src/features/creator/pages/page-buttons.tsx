import { useState } from "react";
import { RiAddLine, RiLinkM, RiSettings3Line } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { isImageVariable, isLinkVariable } from "@nowly/presence-creator/creator-activity";
import { BUTTONS_MAX, createButton, textIn } from "@nowly/presence-creator/creator-draft";
import { writtenLocales } from "@nowly/presence-creator/creator-files";
import type { CreatorButton, CreatorDraft, CreatorLink, CreatorPage } from "@nowly/presence-creator/creator-types";
import { Button } from "@/ui/button";
import { Frame } from "@/ui/frame";
import { IconTile } from "@/ui/icon-tile";
import { Row } from "@/ui/row";
import { Sheet } from "@/ui/sheet";
import { CreatorLocaleTabs, useEditLocale } from "@/features/creator/creator-locale-tabs";
import { TemplateInput } from "@/features/creator/pages/template-input";
import { UrlSourceField, type UrlSource } from "@/features/creator/pages/url-source-field";

const BUTTON_MAX_LENGTH = 32;

const toUrlSource = (link: CreatorLink): UrlSource => (link.kind === "page" ? { kind: "default" } : link);

const toLink = (source: UrlSource): CreatorLink => (source.kind === "default" ? { kind: "page" } : source);

export const PageButtons = ({ draft, page, onChange }: {
  draft: CreatorDraft;
  page: CreatorPage;
  onChange: (page: CreatorPage) => void;
}) => {
  const { t } = useI18n();
  const base = draft.baseLocale;
  const locales = writtenLocales(draft);
  const [active, setLocale] = useEditLocale(`page:${page.id}`, locales, base);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = page.buttons.find((button) => button.id === editingId);
  const textVariables = page.variables.filter((variable) => !isImageVariable(variable));

  const setButton = (next: CreatorButton) =>
    onChange({
      ...page,
      buttons: page.buttons.map((button) => (button.id === next.id ? next : button))
    });

  const addButton = () => {
    const button = createButton();
    onChange({
      ...page,
      buttons: [...page.buttons, button]
    });
    setEditingId(button.id);
  };

  const removeButton = (id: string) => {
    onChange({
      ...page,
      buttons: page.buttons.filter((button) => button.id !== id)
    });
    setEditingId(null);
  };

  const linkLabel = (button: CreatorButton): string =>
    button.link.kind === "page" ? t("creator.source.currentPage") : button.link.kind === "custom" ? button.link.template : t("creator.source.page");

  return (
    <Frame
      title={t("creator.buttons.title")}
      description={t("creator.buttons.description", { max: BUTTONS_MAX })}
      padded={false}
      action={
        <Button size="sm" icon={<RiAddLine className="size-3.5" />} disabled={page.buttons.length >= BUTTONS_MAX} onClick={addButton}>
          {t("creator.buttons.addAction")}
        </Button>
      }
    >
      {page.buttons.length === 0 && <p className="px-4 py-5 text-center text-label-md text-muted">{t("creator.buttons.none")}</p>}
      {page.buttons.map((button, index) => (
        <Row
          key={button.id}
          leading={<IconTile icon={<RiLinkM className="size-[18px] text-muted" aria-hidden />} />}
          title={textIn(button.label, base) || t("creator.buttons.untitled", { index: index + 1 })}
          description={<span className="block truncate">{linkLabel(button)}</span>}
          trailing={
            <Button variant="secondary" size="icon-sm" aria-label={t("creator.buttons.edit")} onClick={() => setEditingId(button.id)}>
              <RiSettings3Line className="size-4" />
            </Button>
          }
        />
      ))}
      <Sheet
        open={Boolean(editing)}
        onClose={() => setEditingId(null)}
        title={t("creator.buttons.add")}
        closeLabel={t("action.close")}
        footer={
          <>
            <Button variant="danger" className="flex-1" onClick={() => editing && removeButton(editing.id)}>
              {t("creator.buttons.remove")}
            </Button>
            <Button className="flex-1" onClick={() => setEditingId(null)}>
              {t("creator.buttons.done")}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="flex flex-col gap-5">
            <CreatorLocaleTabs locales={locales} value={active} base={base} onChange={setLocale} />
            <TemplateInput
              label={t("creator.buttons.label")}
              value={editing.label[active] ?? ""}
              placeholder={active !== base ? textIn(editing.label, base) || t("creator.texts.buttonPlaceholder") : t("creator.texts.buttonPlaceholder")}
              maxLength={BUTTON_MAX_LENGTH}
              variables={textVariables}
              onChange={(value) =>
                setButton({
                  ...editing,
                  label: {
                    ...editing.label,
                    [active]: value
                  }
                })
              }
            />
            <UrlSourceField
              read="link"
              label={t("creator.texts.buttonLink")}
              defaultLabel={t("creator.source.currentPage")}
              value={toUrlSource(editing.link)}
              page={page}
              candidates={page.variables.filter(isLinkVariable)}
              onChange={(next, source) =>
                onChange({
                  ...next,
                  buttons: next.buttons.map((button) => (button.id === editing.id ? { ...button, link: toLink(source) } : button))
                })
              }
            />
          </div>
        )}
      </Sheet>
    </Frame>
  );
};