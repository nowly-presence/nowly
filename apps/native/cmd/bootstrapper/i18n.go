//go:build windows

package main

import (
	"strings"
	"syscall"
	"unsafe"
)

var catalog = map[string]map[string]string{
	"fr": {
		"installingTitle":    "Installation de Nowly",
		"installingSubtitle": "Ça ne prendra qu'un instant.",
		"successTitle":       "Nowly est installé !",
		"successSubtitle":    "Tu peux fermer cette fenêtre.",
		"errorTitle":         "Un problème est survenu",
		"errorSubtitle":      "Réessaie ou contacte le support.",
	},
	"en": {
		"installingTitle":    "Installing Nowly",
		"installingSubtitle": "This will only take a moment.",
		"successTitle":       "Nowly is installed!",
		"successSubtitle":    "You can close this window.",
		"errorTitle":         "Something went wrong",
		"errorSubtitle":      "Please retry or contact support.",
	},
	"es": {
		"installingTitle":    "Instalando Nowly",
		"installingSubtitle": "Solo tomará un momento.",
		"successTitle":       "¡Nowly está instalado!",
		"successSubtitle":    "Ya puedes cerrar esta ventana.",
		"errorTitle":         "Algo salió mal",
		"errorSubtitle":      "Vuelve a intentarlo o contacta con soporte.",
	},
	"pt": {
		"installingTitle":    "Instalando o Nowly",
		"installingSubtitle": "Isso vai levar só um instante.",
		"successTitle":       "Nowly instalado!",
		"successSubtitle":    "Você já pode fechar esta janela.",
		"errorTitle":         "Algo deu errado",
		"errorSubtitle":      "Tente novamente ou contate o suporte.",
	},
	"de": {
		"installingTitle":    "Nowly wird installiert",
		"installingSubtitle": "Das dauert nur einen Moment.",
		"successTitle":       "Nowly ist installiert!",
		"successSubtitle":    "Du kannst dieses Fenster jetzt schließen.",
		"errorTitle":         "Etwas ist schiefgelaufen",
		"errorSubtitle":      "Bitte versuche es erneut oder kontaktiere den Support.",
	},
	"ja": {
		"installingTitle":    "Nowly をインストール中",
		"installingSubtitle": "少々お待ちください。",
		"successTitle":       "Nowly をインストールしました!",
		"successSubtitle":    "このウィンドウを閉じてください。",
		"errorTitle":         "問題が発生しました",
		"errorSubtitle":      "もう一度お試しいただくか、サポートにお問い合わせください。",
	},
	"ru": {
		"installingTitle":    "Установка Nowly",
		"installingSubtitle": "Это займёт всего мгновение.",
		"successTitle":       "Nowly установлен!",
		"successSubtitle":    "Теперь это окно можно закрыть.",
		"errorTitle":         "Что-то пошло не так",
		"errorSubtitle":      "Повторите попытку или обратитесь в поддержку.",
	},
	"pl": {
		"installingTitle":    "Instalowanie Nowly",
		"installingSubtitle": "To zajmie tylko chwilę.",
		"successTitle":       "Nowly zostało zainstalowane!",
		"successSubtitle":    "Możesz już zamknąć to okno.",
		"errorTitle":         "Coś poszło nie tak",
		"errorSubtitle":      "Spróbuj ponownie lub skontaktuj się z pomocą techniczną.",
	},
}

// fontFaceFor returns the GDI face name to use for a language. Satoshi
// (embedded, see satoshi.ttf) only covers Latin scripts — no Cyrillic, no
// CJK (checked against its cmap table) — so ru/ja fall back to fonts that
// ship with Windows and do cover those scripts.
func fontFaceFor(lang string) string {
	switch lang {
	case "ru":
		return "Segoe UI"
	case "ja":
		return "Yu Gothic UI"
	default:
		return fontFace
	}
}

func t(lang, key string) string {
	table, ok := catalog[lang]
	if !ok {
		table = catalog["en"]
	}
	return table[key]
}

func detectLocale() string {
	buf := make([]uint16, 85)
	ret, _, _ := procGetUserDefaultLocaleName.Call(uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
	if ret == 0 {
		return "en"
	}
	name := strings.ToLower(syscall.UTF16ToString(buf))
	for _, lang := range []string{"fr", "es", "pt", "de", "ja", "ru", "pl"} {
		if strings.HasPrefix(name, lang) {
			return lang
		}
	}
	return "en"
}
