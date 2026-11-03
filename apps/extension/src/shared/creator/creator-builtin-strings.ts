import type { LongLocale } from "@/shared/locales";

type BuiltinKey = "browsing" | "showButtonsLabel" | "showButtonsDescription" | "showBrowsingLabel" | "showBrowsingDescription";

export const CREATOR_BUILTIN_STRINGS: Record<LongLocale, Record<BuiltinKey, string>> = {
  "en-US": {
    browsing: "Browsing",
    showButtonsLabel: "Show buttons",
    showButtonsDescription: "Show a button to open the current page.",
    showBrowsingLabel: "Show browsing activity",
    showBrowsingDescription: "Show activity on the other pages of the site."
  },
  "fr-FR": {
    browsing: "Navigue",
    showButtonsLabel: "Afficher les boutons",
    showButtonsDescription: "Affiche un bouton pour ouvrir la page en cours.",
    showBrowsingLabel: "Afficher l'activité de navigation",
    showBrowsingDescription: "Affiche l'activité sur les autres pages du site."
  },
  "es-ES": {
    browsing: "Navegando",
    showButtonsLabel: "Mostrar botones",
    showButtonsDescription: "Muestra un botón para abrir la página actual.",
    showBrowsingLabel: "Mostrar actividad de navegación",
    showBrowsingDescription: "Muestra actividad en las demás páginas del sitio."
  },
  "de-DE": {
    browsing: "Stöbert",
    showButtonsLabel: "Schaltflächen anzeigen",
    showButtonsDescription: "Zeigt eine Schaltfläche zum Öffnen der aktuellen Seite.",
    showBrowsingLabel: "Surfaktivität anzeigen",
    showBrowsingDescription: "Zeigt Aktivität auf den anderen Seiten der Website."
  },
  "pt-BR": {
    browsing: "Navegando",
    showButtonsLabel: "Mostrar botões",
    showButtonsDescription: "Mostra um botão para abrir a página atual.",
    showBrowsingLabel: "Mostrar atividade de navegação",
    showBrowsingDescription: "Mostra atividade nas outras páginas do site."
  },
  "pl-PL": {
    browsing: "Przegląda",
    showButtonsLabel: "Pokaż przyciski",
    showButtonsDescription: "Pokazuje przycisk otwierający bieżącą stronę.",
    showBrowsingLabel: "Pokaż aktywność przeglądania",
    showBrowsingDescription: "Pokazuje aktywność na pozostałych stronach serwisu."
  },
  "ja-JP": {
    browsing: "閲覧中",
    showButtonsLabel: "ボタンを表示",
    showButtonsDescription: "現在のページを開くボタンを表示します。",
    showBrowsingLabel: "閲覧アクティビティを表示",
    showBrowsingDescription: "サイトのほかのページでもアクティビティを表示します。"
  },
  "ko-KR": {
    browsing: "둘러보는 중",
    showButtonsLabel: "버튼 표시",
    showButtonsDescription: "현재 페이지를 여는 버튼을 표시합니다.",
    showBrowsingLabel: "탐색 활동 표시",
    showBrowsingDescription: "사이트의 다른 페이지에서도 활동을 표시합니다."
  },
  "tr-TR": {
    browsing: "Geziniyor",
    showButtonsLabel: "Düğmeleri göster",
    showButtonsDescription: "Geçerli sayfayı açan bir düğme gösterir.",
    showBrowsingLabel: "Gezinme etkinliğini göster",
    showBrowsingDescription: "Sitenin diğer sayfalarında da etkinlik gösterir."
  },
  "ms-MY": {
    browsing: "Melayari",
    showButtonsLabel: "Tunjukkan butang",
    showButtonsDescription: "Tunjukkan butang untuk membuka halaman semasa.",
    showBrowsingLabel: "Tunjukkan aktiviti melayari",
    showBrowsingDescription: "Tunjukkan aktiviti pada halaman lain di laman ini."
  },
  "el-GR": {
    browsing: "Περιηγείται",
    showButtonsLabel: "Εμφάνιση κουμπιών",
    showButtonsDescription: "Εμφανίζει ένα κουμπί για άνοιγμα της τρέχουσας σελίδας.",
    showBrowsingLabel: "Εμφάνιση δραστηριότητας περιήγησης",
    showBrowsingDescription: "Εμφανίζει δραστηριότητα και στις άλλες σελίδες του ιστότοπου."
  }
};