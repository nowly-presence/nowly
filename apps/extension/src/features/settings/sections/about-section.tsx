import { useState, type ReactNode } from "react"
import { RiBookOpenLine, RiDiscordLine, RiExternalLinkLine, RiGithubLine, RiGlobalLine, RiHeart3Line, RiKeyboardLine, RiStarLine } from "@remixicon/react"
import { useI18n } from "@/hooks/i18n-provider"
import { keyboardShortcuts } from "@/lib/keyboard-shortcuts"
import { IS_CANARY } from "@/shared/brand"
import { openUrl, siteUrl, storeReviews } from "@/shared/browser-links"
import { DISCORD_INVITE_URL, GITHUB_URL } from "@/shared/constants"
import { dismissReviewPrompt } from "@/shared/review-prompt"
import { Group } from "@/ui/card"
import { Row } from "@/ui/row"
import { Section } from "@/ui/section"
import { SupportSheet } from "@/features/settings/support-sheet"

const ICON_CLASS = "size-[18px] text-muted"

const LinkRow = ({ icon, title, href }: { icon: ReactNode; title: string; href: string }) => (
  <Row leading={icon} title={title} onClick={() => openUrl(href)} trailing={<RiExternalLinkLine className="size-4 text-muted" />} />
)

export const AboutSection = () => {
  const { t } = useI18n()
  const shortcuts = keyboardShortcuts()
  const version = chrome.runtime.getManifest().version
  const reviews = storeReviews()
  const [supportOpen, setSupportOpen] = useState(false)

  const rate = () => {
    openUrl(reviews.url)
    void dismissReviewPrompt()
  }

  return (
    <Section title={t("settings.about")}>
      <Group>
        <Row title={t("settings.version")} trailing={<span className="text-label-md text-muted tabular-nums">{IS_CANARY ? `${version} (Canary)` : version}</span>} />
        <Row
          leading={<RiKeyboardLine className={ICON_CLASS} />}
          title={t("settings.shortcuts")}
          description={t("settings.shortcutsHint", { open: shortcuts.openPanel, pause: shortcuts.togglePause })}
        />
        <Row
          leading={<RiStarLine className={ICON_CLASS} />}
          title={t("review.rate")}
          description={t("review.rateHint", { store: reviews.store })}
          onClick={rate}
          trailing={<RiExternalLinkLine className="size-4 text-muted" />}
        />
        <Row
          leading={<RiHeart3Line className={ICON_CLASS} />}
          title={t("support.rowTitle")}
          description={t("support.rowHint")}
          onClick={() => setSupportOpen(true)}
          chevron
        />
        <LinkRow icon={<RiGlobalLine className={ICON_CLASS} />} title="nowly.me" href={siteUrl("/")} />
        <LinkRow icon={<RiBookOpenLine className={ICON_CLASS} />} title={t("settings.changelog")} href={siteUrl("/changelog")} />
        <LinkRow icon={<RiDiscordLine className={ICON_CLASS} />} title={t("settings.community")} href={DISCORD_INVITE_URL} />
        <LinkRow icon={<RiGithubLine className={ICON_CLASS} />} title="GitHub" href={GITHUB_URL} />
      </Group>
      <p className="px-1 pt-2 text-label-md text-muted text-balance">{t("settings.privacyNote")}</p>
      <SupportSheet open={supportOpen} onClose={() => setSupportOpen(false)} />
    </Section>
  )
}
