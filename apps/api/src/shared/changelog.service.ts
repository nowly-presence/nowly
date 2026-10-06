import { buildLocalizedValue, buildLocaleObject, LocaleRecordSchema, SUPPORTED_LOCALES, type LocaleString } from "@nowly/locales"
import { z } from "zod"

const ChangelogSchema = LocaleRecordSchema(z.string().min(1))

export interface ChangelogContext {
  type: "new" | "modified"
  name: string
  names?: Record<string, string>
  description?: string
  descriptions?: Record<string, string>
  changedFiles?: string[]
}

type Changelog = z.infer<typeof ChangelogSchema>
type LocalizedText = Record<LocaleString, string>

type ModifiedChange =
  | "localization"
  | "localizationAndBehavior"
  | "behavior"
  | "metadata"
  | "artwork"
  | "generic"

const localeName = (ctx: ChangelogContext, locale: string): string =>
  ctx.names?.[locale] || ctx.names?.["en-US"] || ctx.name

const description = (ctx: ChangelogContext, locale: string): string =>
  (ctx.descriptions?.[locale] || ctx.descriptions?.["en-US"] || ctx.description || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160)

const changedFileFlags = (files: string[]) => {
  const normalized = files.map((file) => file.replaceAll("\\", "/").toLowerCase())
  return {
    locale: normalized.some((file) => file.includes("/locales/")),
    behavior: normalized.some((file) => /\/presence\.(ts|tsx|js|jsx)$/.test(file) || file.includes("/utils/")),
    metadata: normalized.some((file) => file.endsWith("/metadata.json")),
    artwork: normalized.some((file) => file.includes("/assets/") || /(?:artwork|thumbnail|image)/.test(file)),
  }
}

const modifiedChange = (files: string[]): ModifiedChange => {
  const flags = changedFileFlags(files)
  if (flags.locale && flags.behavior) return "localizationAndBehavior"
  if (flags.locale) return "localization"
  if (flags.behavior) return "behavior"
  if (flags.metadata) return "metadata"
  if (flags.artwork) return "artwork"
  return "generic"
}

const modifiedMessage = (change: ModifiedChange, name: string): LocalizedText => {
  const messages: Record<ModifiedChange, LocalizedText> = {
    localization: {
      "en-US": `Added missing translations for ${name}.`,
      "fr-FR": `Ajout des traductions manquantes pour ${name}.`,
      "es-ES": `Se añadieron las traducciones que faltaban para ${name}.`,
      "de-DE": `Fehlende Übersetzungen für ${name} hinzugefügt.`,
      "pt-BR": `Traduções que faltavam para ${name} foram adicionadas.`,
      "pl-PL": `Dodano brakujące tłumaczenia dla ${name}.`,
      "ja-JP": `${name}に不足していた翻訳を追加しました。`,
      "ko-KR": `${name}에 누락된 번역을 추가했습니다.`,
      "tr-TR": `${name} için eksik çeviriler eklendi.`,
      "ms-MY": `Terjemahan yang tiada untuk ${name} telah ditambah.`,
      "el-GR": `Προστέθηκαν οι μεταφράσεις που έλειπαν για το ${name}.`,
    },
    localizationAndBehavior: {
      "en-US": `Added localized activity text and completed translations for ${name}.`,
      "fr-FR": `Ajout de textes d'activité localisés et complétion des traductions pour ${name}.`,
      "es-ES": `Se añadieron textos de actividad localizados y se completaron las traducciones para ${name}.`,
      "de-DE": `Lokalisierte Aktivitätstexte und vollständige Übersetzungen für ${name} hinzugefügt.`,
      "pt-BR": `Textos de atividade localizados e traduções completas adicionados para ${name}.`,
      "pl-PL": `Dodano zlokalizowane teksty aktywności i uzupełniono tłumaczenia dla ${name}.`,
      "ja-JP": `${name}のローカライズされたアクティビティテキストと翻訳を追加しました。`,
      "ko-KR": `${name}에 현지화된 활동 텍스트를 추가하고 번역을 완료했습니다.`,
      "tr-TR": `${name} için yerelleştirilmiş etkinlik metinleri ve eksiksiz çeviriler eklendi.`,
      "ms-MY": `Teks aktiviti setempat dan terjemahan lengkap untuk ${name} telah ditambah.`,
      "el-GR": `Προστέθηκαν τοπικοποιημένα κείμενα δραστηριότητας και ολοκληρώθηκαν οι μεταφράσεις για το ${name}.`,
    },
    behavior: {
      "en-US": `Improved ${name} activity detection and Discord updates.`,
      "fr-FR": `Amélioration de la détection d'activité et des mises à jour Discord de ${name}.`,
      "es-ES": `Mejoras en la detección de actividad y las actualizaciones de Discord de ${name}.`,
      "de-DE": `Aktivitätserkennung und Discord-Aktualisierungen für ${name} verbessert.`,
      "pt-BR": `Detecção de atividade e atualizações do Discord do ${name} aprimoradas.`,
      "pl-PL": `Ulepszono wykrywanie aktywności ${name} i aktualizacje na Discordzie.`,
      "ja-JP": `${name}のアクティビティ検出とDiscordの更新を改善しました。`,
      "ko-KR": `${name} 활동 감지 및 Discord 업데이트를 개선했습니다.`,
      "tr-TR": `${name} etkinlik algılama ve Discord güncellemeleri iyileştirildi.`,
      "ms-MY": `Pengesanan aktiviti dan kemas kini Discord untuk ${name} ditambah baik.`,
      "el-GR": `Βελτιώθηκε ο εντοπισμός δραστηριότητας και οι ενημερώσεις Discord για το ${name}.`,
    },
    metadata: {
      "en-US": `Updated ${name} library details.`,
      "fr-FR": `Mise à jour des informations de ${name} dans la bibliothèque.`,
      "es-ES": `Se actualizaron los detalles de ${name} en la biblioteca.`,
      "de-DE": `Bibliotheksdetails von ${name} aktualisiert.`,
      "pt-BR": `Detalhes de ${name} na biblioteca atualizados.`,
      "pl-PL": `Zaktualizowano szczegóły ${name} w bibliotece.`,
      "ja-JP": `ライブラリの${name}情報を更新しました。`,
      "ko-KR": `라이브러리의 ${name} 정보를 업데이트했습니다.`,
      "tr-TR": `${name} kitaplık ayrıntıları güncellendi.`,
      "ms-MY": `Butiran ${name} dalam pustaka telah dikemas kini.`,
      "el-GR": `Ενημερώθηκαν οι λεπτομέρειες του ${name} στη βιβλιοθήκη.`,
    },
    artwork: {
      "en-US": `Updated ${name} artwork.`,
      "fr-FR": `Mise à jour des visuels de ${name}.`,
      "es-ES": `Se actualizaron los recursos visuales de ${name}.`,
      "de-DE": `Artwork von ${name} aktualisiert.`,
      "pt-BR": `Arte de ${name} atualizada.`,
      "pl-PL": `Zaktualizowano grafiki ${name}.`,
      "ja-JP": `${name}のアートワークを更新しました。`,
      "ko-KR": `${name} 아트워크를 업데이트했습니다.`,
      "tr-TR": `${name} görselleri güncellendi.`,
      "ms-MY": `Karya seni ${name} telah dikemas kini.`,
      "el-GR": `Ενημερώθηκαν τα γραφικά του ${name}.`,
    },
    generic: {
      "en-US": `Updated the ${name} presence.`,
      "fr-FR": `Mise à jour de la présence ${name}.`,
      "es-ES": `Se actualizó la presencia de ${name}.`,
      "de-DE": `Die ${name}-Präsenz wurde aktualisiert.`,
      "pt-BR": `A presença do ${name} foi atualizada.`,
      "pl-PL": `Zaktualizowano obecność ${name}.`,
      "ja-JP": `${name}のプレゼンスを更新しました。`,
      "ko-KR": `${name} 프레즌스를 업데이트했습니다.`,
      "tr-TR": `${name} etkinliği güncellendi.`,
      "ms-MY": `Presence ${name} telah dikemas kini.`,
      "el-GR": `Ενημερώθηκε η παρουσία του ${name}.`,
    },
  }
  return messages[change]
}

const newMessage = (locale: LocaleString, name: string, text: string): string => {
  const suffix = text ? ` - ${text}` : ""
  const templates: Record<LocaleString, string> = {
    "en-US": `Add ${name} presence${suffix}`,
    "fr-FR": `Ajout de ${name}${suffix}`,
    "es-ES": `Añadir ${name}${suffix}`,
    "de-DE": `${name}-Präsenz hinzufügen${suffix}`,
    "pt-BR": `Adicionar a presença do ${name}${suffix}`,
    "pl-PL": `Dodano obecność ${name}${suffix}`,
    "ja-JP": `${name}のプレゼンスを追加しました${suffix}`,
    "ko-KR": `${name} 프레즌스를 추가했습니다${suffix}`,
    "tr-TR": `${name} etkinliği eklendi${suffix}`,
    "ms-MY": `Tambah presence ${name}${suffix}`,
    "el-GR": `Προσθήκη παρουσίας ${name}${suffix}`,
  }
  return templates[locale]
}

const fallbackChangelogs = (ctx: ChangelogContext): Changelog => {
  if (ctx.type === "new") {
    const localized = Object.fromEntries(
      SUPPORTED_LOCALES.map((locale) => [
        locale,
        newMessage(locale, localeName(ctx, locale), description(ctx, locale)),
      ]),
    ) as LocalizedText
    return buildLocalizedValue(localized, localized["en-US"])
  }

  const messages = modifiedMessage(modifiedChange(ctx.changedFiles || []), ctx.name)
  return buildLocalizedValue(messages, messages["en-US"])
}

/**
 * User-provided changelogs stay authoritative. We intentionally do not call an
 * external translator here: release notes must remain deterministic and never
 * expose a provider failure or raw diff in the public library.
 */
export const translateChangelog = (text: string): Changelog => buildLocaleObject(text)

/**
 * Generate a short, deterministic note from changed file categories.
 * Raw diffs are never used as user-facing copy.
 */
export const generateChangelog = async (ctx: ChangelogContext): Promise<Changelog> =>
  fallbackChangelogs(ctx)
