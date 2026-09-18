import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

const GH = "https://github.com/nowly-presence/nowly"
const KOFI = "https://ko-fi.com/nowly"
const SPONSORS = "https://github.com/sponsors/nowly-presence"
const DOCS = "https://docs.nowly.me"
const CNIL = "https://www.cnil.fr"
const ODR = "https://ec.europa.eu/consumers/odr"
const DISCORD_PRIVACY = "https://discord.com/privacy"
const DISCORD_TOS = "https://discord.com/terms"
const CONTABO_PRIVACY = "https://contabo.com/en/legal/privacy-policy/"
const CONTABO_IMPRESSUM = "https://contabo.com/en/legal/impressum/"
const CONTACT = "contact@qkimi.fr"

const locales = {
  "en-US": {
    related: {
      tos: {
        title: "Terms of Service",
        description: "The rules for using Nowly, the browser extension, desktop app, and the website.",
      },
    },
    "cookie-banner": {
      message:
        "This site uses a strictly necessary language cookie. If advertising is later enabled, Google may also use advertising technologies.",
      "learn-more": "Learn more",
      dismiss: "Got it",
    },
    "privacy-page": {
      badge: "Privacy",
      title: "Privacy Policy",
      description: "How Nowly handles your data, what stays on your device, and what depends on your consent.",
      "last-updated": "Last updated: 17 September 2026.",
      intro: `This policy describes how <strong>{publisherName}</strong> (“we”), as data controller, processes personal data in connection with Nowly. Rich Presence activity is sent from your browser to the Discord client <strong>on your machine</strong>. It does not pass through our servers. Optional usage statistics and a few website features do involve our API or processors, as described below.`,
      sections: [
        {
          title: "Controller",
          body: `The controller is <strong>{publisherName}</strong>, sole trader (micro-enterprise), SIREN {publisherSiren}, {publisherAddress}. Email: <a href="mailto:{publisherEmail}">{publisherEmail}</a>. Full identification is in the <a href="/legal-notice">legal notice</a>. No data protection officer has been appointed.`,
        },
        {
          title: "What Nowly is",
          body: `Nowly includes a <strong>browser extension</strong> (Chrome and Firefox), a <strong>desktop app</strong> that talks to Discord locally, a <strong>website</strong> (nowly.me), <strong>documentation</strong> (<a href="${DOCS}">docs.nowly.me</a>), a public <strong>API</strong>, and optional <strong>Canary</strong> test builds. The extension detects supported sites in your browser and, with the desktop app, updates Discord Rich Presence over a local IPC channel.`,
        },
        {
          title: "Data processed on your device (extension)",
          body: `The extension stores data in the browser’s local storage API (Chrome <code>chrome.storage.local</code> / Firefox equivalent). It stays on that device unless you enable optional analytics or use a custom API URL:<ul><li>Installed presences (metadata, signed bundles, activation state).</li><li>Current activity (title, platform, duration, thumbnail URL).</li><li>A debug log (timestamps, actions, visited URLs of supported sites).</li><li>Onboarding state and a <strong>local snapshot</strong> of your Discord profile (ID, username, avatar) used only to display the extension UI, taken from the local Discord client.</li><li>Display preferences, shortcuts, and per-presence settings.</li><li>A locally generated device identifier (UUID) used if you opt into analytics.</li></ul>You can erase this data by resetting the extension or uninstalling it.`,
        },
        {
          title: "Browser extension permissions",
          body: `The extension needs certain permissions to work:<ul><li><strong>Access to websites</strong> (including a broad host permission): a lightweight content script can run on pages you visit so Nowly can detect supported platforms. It is not used to send your browsing history to our servers.</li><li><strong>User Scripts</strong> (Chromium): presence scripts run on matching sites. Official catalogue scripts are cryptographically signed (ECDSA P-256) and verified locally before they run. Canary and sideloaded packages may not carry the same production signature guarantees; treat them as experimental.</li></ul>`,
        },
        {
          title: "Data processed on your device (desktop app)",
          body: `The desktop app may write a local log named <code>nowly-host.log</code> under the NowlyClient cache directory, for example:<ul><li>Windows: <code>%LOCALAPPDATA%\\NowlyClient\\</code></li><li>macOS: <code>~/Library/Caches/NowlyClient/</code></li><li>Linux: <code>~/.cache/NowlyClient/</code></li></ul>The file can include timestamps and activity details sent to Discord. It stays on your computer and is not uploaded to our servers. You may delete it at any time.`,
        },
        {
          title: "Usage statistics (opt-in)",
          body: `Analytics are <strong>off by default</strong>. If you enable them during onboarding or later in extension settings, our API may receive:<ul><li>Your device UUID (pseudonymous: it is not your Discord or Google account, but it is still personal data under the GDPR because it can identify your installation).</li><li>Browser, OS, language, extension version, and desktop app version.</li><li>Installed presence slugs/versions and usage events (for example installs, heartbeats, ratings) with a limited payload.</li></ul>We use this to improve Nowly and to show how popular presences are. Turning the setting off <strong>stops further collection</strong> and records that consent is withdrawn. It does <strong>not</strong> by itself erase events already stored. To have server-side records deleted, email <a href="mailto:{publisherEmail}">{publisherEmail}</a> with your device ID (visible in the extension) or another element that lets us locate the record.`,
        },
        {
          title: "Discord",
          body: `Nowly talks to the Discord desktop/browser client through <strong>local IPC</strong>. Typical Rich Presence fields include platform name, title, channel or author, play/pause state, and timestamps. Anyone who can see your Discord profile may see that status. Once Discord receives it, Discord’s own processing applies. See <a href="${DISCORD_PRIVACY}">Discord’s privacy policy</a>.<br/><br/>The API can also issue a session token (JWT, typically 30 days) after optional Discord OAuth for account features (for example reviews). The public marketing site does not require an account. If you never log in, we do not create that token for you.`,
        },
        {
          title: "Legal bases (GDPR Art. 6)",
          body: `<ul><li><strong>Opt-in usage statistics</strong>: consent (Art. 6(1)(a)). You may withdraw it in the extension at any time, without affecting the lawfulness of processing before withdrawal.</li><li><strong>Language cookie and documentation cookie</strong>: necessary for the service you request and/or legitimate interest in remembering your language (Art. 6(1)(b) and/or (f)).</li><li><strong>Theme and cookie-notice flags</strong> (local storage): legitimate interest in a usable interface (Art. 6(1)(f)).</li><li><strong>Image proxy</strong>: legitimate interest in displaying catalogue and activity artwork without loading every third-party CDN in your browser (Art. 6(1)(f)).</li><li><strong>Optional Discord login</strong>: performance of the account feature you request (Art. 6(1)(b)) and, where needed, our legitimate interest in securing the API (Art. 6(1)(f)).</li><li><strong>GitHub, Discord community, Ko-fi, GitHub Sponsors</strong>: data you choose to send to those services is processed under their policies; we read public issues or messages you address to us in order to reply (Art. 6(1)(b) or (f)).</li></ul>`,
        },
        {
          title: "Retention",
          body: `<ul><li><strong>Local extension and desktop logs</strong>: until you delete them, reset, or uninstall.</li><li><strong>Language cookie</strong>: 1 year, refreshed when you change language.</li><li><strong>Usage statistics</strong>: kept only as long as needed to produce aggregated metrics. There is <strong>no automatic 12-month purge</strong> implemented today. You may request erasure as described above.</li><li><strong>JWT (if you log in)</strong>: about 30 days unless you log out or we revoke it.</li></ul>`,
        },
        {
          title: "Processors and transfers",
          body: `We use:<ul><li><strong>Contabo GmbH</strong> (Germany) as hosting provider of the VPS on which we run the website, API, and PostgreSQL. The publisher administers the server. Processing takes place in the <strong>{dataRegion}</strong>. This is an intra-EU hosting arrangement, not a transfer to the United States. <a href="${CONTABO_PRIVACY}">Contabo privacy policy</a>.</li><li><strong>Cloudflare</strong> to deliver static files (thumbnails, desktop installers, Canary zips) and to protect the sites. Transfers may rely on SCCs and, where applicable, the EU-US Data Privacy Framework.</li><li><strong>Google</strong> (Chrome Web Store) and <strong>Mozilla</strong> (Firefox Add-ons) to distribute the extension; their stores process installer and account data under their own terms.</li><li><strong>Google AdSense</strong> only <strong>if advertising is enabled</strong> on the website (it is off unless we turn it on). Google then acts as an independent controller or joint controller for its advertising cookies, according to Google’s terms.</li></ul>If you set a <strong>custom API URL</strong>, traffic goes to the server you chose. This policy does not apply to that server.`,
        },
        {
          title: "Image proxy",
          body: `Our API can fetch public thumbnail URLs (YouTube, Twitch, and similar CDNs) so the UI can display artwork. We do not use the proxy to sell advertising profiles. The requested URL can still relate to a title you were viewing. Logs of those requests are kept only as technically needed to operate and secure the service.`,
        },
        {
          title: "Cookies",
          body: `nowly.me and docs.nowly.me each set a <code>locale</code> cookie for language. Theme and the cookie notice use local storage, not cookies. See the <a href="/cookies">cookie policy</a>.`,
        },
        {
          title: "Security",
          body: `Official presence packages are signed (ECDSA P-256). The production extension verifies signatures before running catalogue presences. Canary builds distributed as zip files are test software and may be unsigned. Do not install packages from untrusted sources.`,
        },
        {
          title: "Your rights",
          body: `If the GDPR applies, you may request access, rectification, erasure, restriction, objection, and portability, and you may withdraw consent for analytics. Developer diagnostics in the extension may show events still queued on your device; they are not a complete export of our servers. To exercise rights, email <a href="mailto:{publisherEmail}">{publisherEmail}</a> or use the <a href="${GH}">GitHub repository</a>. You may also lodge a complaint with the <a href="${CNIL}">CNIL</a> (France) or your local supervisory authority.`,
        },
        {
          title: "Contact",
          body: `Email: <a href="mailto:{publisherEmail}">{publisherEmail}</a>. Publisher details: <a href="/legal-notice">legal notice</a>.`,
        },
      ],
    },
    "tos-page": {
      badge: "Legal",
      title: "Terms of Service",
      description: "The rules for using Nowly, the browser extension, desktop app, and the website.",
      "last-updated": "Last updated: 17 September 2026.",
      sections: [
        {
          title: "Acceptance",
          body: `By downloading, installing, or using Nowly (extension, desktop app, website, documentation, API, and related software), you agree to these terms. If you do not agree, do not use the software. Mandatory consumer rights remain unaffected.`,
        },
        {
          title: "Service",
          body: `Nowly is a <strong>free</strong> tool that updates Discord Rich Presence from supported websites, using a local desktop app. Source code is available on GitHub under BUSL-1.1 (source-available; not an OSI-approved open-source licence until the Change Date). The service includes:<ul><li>A browser extension for Chromium and Firefox.</li><li>A desktop app that talks to Discord on your computer.</li><li>The nowly.me website and docs.nowly.me.</li><li>A public API and a developer SDK to build presences.</li><li>Optional Canary builds from our CDN, which are pre-release and may be unsigned.</li></ul>`,
        },
        {
          title: "Minimum age",
          body: `You must be at least <strong>15</strong> and old enough to use Discord under Discord’s own terms. If you are under the digital age of consent in your country, you need permission from a parent or guardian where the law requires it.`,
        },
        {
          title: "Licence",
          body: `Nowly is licensed under the <strong>Business Source License 1.1</strong>. You may use, copy, and modify it for <strong>personal, non-commercial</strong> purposes. Commercial use (including resale or offering Nowly as a paid or hosted service) needs a separate licence from the publisher. The licence converts to MIT on the Change Date: four years after first public distribution, and in any event no earlier than <strong>1 June 2028</strong>. The full text is in the <a href="${GH}">GitHub repository</a>. This does not license third-party content (YouTube, Twitch, and so on) that you display through Nowly.`,
        },
        {
          title: "Acceptable use",
          body: `You must comply with applicable law and <a href="${DISCORD_TOS}">Discord’s Terms of Service</a>. You must not:<ul><li>Use Nowly to display illegal, hateful, defamatory, or infringing content.</li><li>Bypass security of the official extension, desktop app, or API.</li><li>Distribute modified, forged, or unauthorized presences through Nowly’s official infrastructure.</li><li>Abuse the API (including excessive automated requests).</li></ul>If you point the extension at a <strong>custom API URL</strong>, you are solely responsible for that server. Our <a href="/privacy">privacy policy</a> does not cover it.`,
        },
        {
          title: "Donations",
          body: `Nowly remains usable without payment. Voluntary support via <a href="${KOFI}">Ko-fi</a> or <a href="${SPONSORS}">GitHub Sponsors</a> is processed by those platforms under their own terms. A donation does not buy extra product features unless we clearly say otherwise at the time. Refunds follow the platform’s rules and, where they apply, mandatory consumer rights.`,
        },
        {
          title: "Intellectual property",
          body: `The Nowly code is licensed as above. Discord, YouTube, Twitch, Disney+, Apple TV+, Prime Video, TikTok and other platform names and logos belong to their owners. Nowly is <strong>not affiliated with, endorsed by, or sponsored by</strong> Discord Inc. or those platforms.`,
        },
        {
          title: "Limitation of liability",
          body: `Nowly is provided <strong>“as is”</strong>, without warranty, to the extent permitted by law. We are not liable for indirect damage arising from use or inability to use the software, including Discord outages or sanctions against your Discord account, or loss of local extension data. Nothing excludes liability for fraud, gross negligence, death or personal injury, or any liability that French or EU law does not allow us to limit. These clauses do not reduce mandatory consumer rights.`,
        },
        {
          title: "Privacy",
          body: `Use of Nowly is also governed by the <a href="/privacy">privacy policy</a> and <a href="/cookies">cookie policy</a>.`,
        },
        {
          title: "Changes",
          body: `We may update these terms by publishing a new version on this page, with a new “last updated” date. For material changes we will try to give reasonable notice on the site or repository. Continued use after the new version takes effect means you accept it, except where the law requires your explicit agreement.`,
        },
        {
          title: "Governing law",
          body: `These terms are governed by <strong>French law</strong>. If an amicable solution fails, French courts have jurisdiction, without prejudice to mandatory consumer venue rules. The <a href="${ODR}">EU online dispute resolution platform</a> is available.`,
        },
        {
          title: "Contact",
          body: `Email <a href="mailto:{publisherEmail}">{publisherEmail}</a> or see the <a href="/legal-notice">legal notice</a>. GitHub: <a href="${GH}">${GH.replace("https://", "")}</a>.`,
        },
      ],
    },
    "legal-notice-page": {
      badge: "Legal",
      title: "Legal Notice",
      description: "Publisher, hosting, and intellectual property information required under French law.",
      "last-updated": "Effective 17 September 2026. Required under French LCEN, article 6-III.",
      sections: [
        {
          title: "Publisher",
          body: `The websites <strong>nowly.me</strong> and <strong>docs.nowly.me</strong>, the Nowly browser extension and the desktop app are published by:<br/><br/>Publisher: <strong>{publisherName}</strong><br/>Status: Sole trader (auto-entrepreneur / micro-enterprise)<br/>SIREN: <strong>{publisherSiren}</strong><br/>Address: <strong>{publisherAddress}</strong><br/>VAT: Not applicable (French CGI art. 293 B exemption)<br/>Email: <a href="mailto:{publisherEmail}">{publisherEmail}</a>`,
        },
        {
          title: "Publication director",
          body: `<strong>{publisherName}</strong>, as natural-person publisher. French law provides for a <strong>single</strong> publication director (loi du 29 juillet 1881, applied online). Contributors or developers are not additional publication directors.`,
        },
        {
          title: "Hosting (website, API, database)",
          body: `The website, API and PostgreSQL database run on a virtual private server (VPS) rented from:<br/><br/><strong>Contabo GmbH</strong><br/>Welfenstrasse 22<br/>81541 Munich, Germany<br/><a href="https://contabo.com">contabo.com</a><br/><a href="${CONTABO_IMPRESSUM}">Legal notice (Impressum)</a><br/><br/>The publisher administers the server. Location: <strong>{dataRegion}</strong>`,
        },
        {
          title: "CDN and desktop binaries",
          body: `Static assets (thumbnails, installers, Canary archives) are distributed via:<br/><br/><strong>Cloudflare, Inc.</strong><br/>101 Townsend Street, San Francisco, CA 94107, United States<br/><a href="https://www.cloudflare.com">cloudflare.com</a>`,
        },
        {
          title: "Extension distribution",
          body: `The production extension is distributed for <strong>Chrome</strong> (and other Chromium browsers) via the <strong>Chrome Web Store</strong>, operated by Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, United States, and for <strong>Firefox</strong> via <strong>Firefox Add-ons</strong>, operated by Mozilla Corporation (United States). Experimental Canary builds may also be offered as zip files from our CDN.`,
        },
        {
          title: "Intellectual property",
          body: `Nowly source code is published under <strong>BUSL-1.1</strong> at <a href="${GH}">github.com/nowly-presence/nowly</a>. Third-party trademarks remain their owners’. <strong>Nowly is not affiliated with Discord Inc. or the supported platforms.</strong>`,
        },
        {
          title: "Illegal content",
          body: `Manifestly illegal content may be reported to <a href="mailto:{publisherEmail}">{publisherEmail}</a> with the date, a description, the URL, and the legal grounds, as required by LCEN article 6.`,
        },
        {
          title: "Contact",
          body: `Email: <a href="mailto:{publisherEmail}">{publisherEmail}</a><br/>GitHub: <a href="${GH}">github.com/nowly-presence/nowly</a>`,
        },
      ],
    },
    "cookies-page": {
      badge: "Cookies",
      title: "Cookie Policy",
      description: "Cookies and local storage used on nowly.me and docs.nowly.me.",
      "last-updated": "Last updated: 17 September 2026.",
      intro: `This page describes cookies and similar technologies on <strong>nowly.me</strong> and <strong>docs.nowly.me</strong>. We set a language cookie. Theme and the cookie notice use local storage. Google AdSense is not loaded unless advertising is enabled.`,
      sections: [
        {
          title: "Strictly necessary",
          body: `The language cookie is needed to remember the locale you chose (or that we detected) on each site. It does not require a prior advertising-style consent under the French “cookies and other trackers” guidelines, because it is strictly necessary to provide the multilingual service.`,
        },
        {
          title: "locale cookie",
          body: `<strong><code>locale</code></strong> (nowly.me and, separately, docs.nowly.me)<br/>Purpose: French, English, or Spanish interface.<br/>Duration: 1 year (<code>max-age</code> 31,536,000 seconds), refreshed when you change language.<br/>Attributes: first-party, not HttpOnly, SameSite=Lax. The value is a locale code (for example <code>fr-FR</code>). Combined with your IP address in server logs it can contribute to identifying a visitor, even if the cookie itself is only a language code.`,
        },
        {
          title: "Local storage",
          body: `The sites store the colour theme (light, dark, or system) and whether you dismissed the cookie notice. Those values stay in your browser and are not sent as cookies to Nowly.`,
        },
        {
          title: "Analytics cookies",
          body: `The websites do <strong>not</strong> set third-party analytics cookies. Optional usage statistics, if you enable them, are collected by the <strong>extension</strong> with a device ID, not with a website cookie.`,
        },
        {
          title: "Advertising",
          body: `If we enable <strong>Google AdSense</strong> on the website, Google may set cookies or similar technologies under its own policy. Until then, Nowly does not place advertising cookies.`,
        },
        {
          title: "How to delete them",
          body: `You can block or delete cookies in your browser. Deleting <code>locale</code> resets the language to the detected value on the next visit.`,
        },
        {
          title: "Contact",
          body: `Email <a href="mailto:{publisherEmail}">{publisherEmail}</a> or see the <a href="/legal-notice">legal notice</a>.`,
        },
      ],
    },
  },
}

locales["fr-FR"] = {
  related: {
    tos: {
      title: "Conditions d’utilisation",
      description: "Les règles d'utilisation de Nowly, de l'extension navigateur, de l'application bureau et du site web.",
    },
  },
  "cookie-banner": {
    message:
      "Ce site utilise un cookie de langue strictement nécessaire. Si la publicité est activée plus tard, Google pourra aussi utiliser des technologies publicitaires.",
    "learn-more": "En savoir plus",
    dismiss: "Compris",
  },
  "privacy-page": {
    badge: "Confidentialité",
    title: "Politique de confidentialité",
    description: "Comment Nowly traite vos données, ce qui reste sur votre appareil et ce qui dépend de votre consentement.",
    "last-updated": "Dernière mise à jour : 17 septembre 2026.",
    intro: `La présente politique décrit les traitements de données personnelles effectués par <strong>{publisherName}</strong> (« nous »), responsable de traitement, dans le cadre de Nowly. L’activité Rich Presence est transmise du navigateur au client Discord <strong>sur votre machine</strong>. Elle ne transite pas par nos serveurs. Les statistiques d’usage optionnelles et quelques fonctions du site font en revanche appel à notre API ou à des sous-traitants, comme indiqué ci-dessous.`,
    sections: [
      {
        title: "Responsable de traitement",
        body: `Le responsable de traitement est <strong>{publisherName}</strong>, auto-entrepreneur (micro-entreprise), SIREN {publisherSiren}, {publisherAddress}. Courriel : <a href="mailto:{publisherEmail}">{publisherEmail}</a>. L’identification complète figure dans les <a href="/legal-notice">mentions légales</a>. Aucun délégué à la protection des données n’a été désigné.`,
      },
      {
        title: "Présentation de Nowly",
        body: `Nowly comprend une <strong>extension navigateur</strong> (Chrome et Firefox), une <strong>application bureau</strong> qui dialogue localement avec Discord, un <strong>site</strong> (nowly.me), une <strong>documentation</strong> (<a href="${DOCS}">docs.nowly.me</a>), une <strong>API</strong> publique et des versions d’essai <strong>Canary</strong>. L’extension détecte les sites pris en charge et, avec l’application bureau, met à jour la Rich Presence Discord via un canal IPC local.`,
      },
      {
        title: "Données traitées sur votre appareil (extension)",
        body: `L’extension enregistre des données dans l’API de stockage local du navigateur (<code>chrome.storage.local</code> sous Chromium, équivalent Firefox). Elles restent sur l’appareil sauf si vous activez les statistiques ou une URL d’API personnalisée :<ul><li>Présences installées (métadonnées, paquets signés, activation).</li><li>Activité en cours (titre, plateforme, durée, URL de miniature).</li><li>Journal de débogage (horodatages, actions, URL des sites reconnus).</li><li>État d’accueil et <strong>copie locale</strong> du profil Discord (identifiant, pseudo, avatar) affichée dans l’interface, issue du client Discord local.</li><li>Préférences, raccourcis et réglages par présence.</li><li>Un identifiant d’appareil (UUID) généré localement, utilisé si vous acceptez les statistiques.</li></ul>Vous pouvez les effacer en réinitialisant ou en désinstallant l’extension.`,
      },
      {
        title: "Permissions de l’extension",
        body: `L’extension a besoin de certaines permissions :<ul><li><strong>Accès aux sites</strong> (permission d’hôte large) : un script de contenu léger peut s’exécuter sur les pages visitées pour détecter les plateformes prises en charge. Il n’est pas utilisé pour nous envoyer votre historique de navigation.</li><li><strong>User Scripts</strong> (Chromium) : les scripts de présence s’exécutent sur les sites correspondants. Les scripts du catalogue officiel sont signés (ECDSA P-256) et vérifiés localement. Les paquets Canary ou chargés manuellement n’offrent pas les mêmes garanties ; considérez-les comme expérimentaux.</li></ul>`,
      },
      {
        title: "Données traitées sur votre appareil (application bureau)",
        body: `L’application bureau peut écrire un journal local <code>nowly-host.log</code> dans le répertoire de cache NowlyClient, par exemple :<ul><li>Windows : <code>%LOCALAPPDATA%\\NowlyClient\\</code></li><li>macOS : <code>~/Library/Caches/NowlyClient/</code></li><li>Linux : <code>~/.cache/NowlyClient/</code></li></ul>Le fichier peut contenir des horodatages et des détails d’activité envoyés à Discord. Il reste sur votre ordinateur et n’est pas téléversé vers nos serveurs. Vous pouvez le supprimer à tout moment.`,
      },
      {
        title: "Statistiques d’usage (opt-in)",
        body: `Les statistiques sont <strong>désactivées par défaut</strong>. Si vous les activez à l’accueil ou plus tard dans les réglages, notre API peut recevoir :<ul><li>Votre UUID d’appareil (pseudonyme : ce n’est pas votre compte Discord ou Google, mais il s’agit bien d’une donnée personnelle au sens du RGPD, car il identifie votre installation).</li><li>Navigateur, système, langue, versions de l’extension et de l’application bureau.</li><li>Identifiants/versions des présences installées et événements d’usage (installations, battements, notes) avec une charge utile limitée.</li></ul>Nous les utilisons pour améliorer Nowly et indiquer la popularité des présences. Désactiver l’option <strong>arrête la collecte</strong> et enregistre le retrait du consentement. Cela <strong>n’efface pas</strong> à lui seul les événements déjà stockés. Pour une suppression côté serveur, écrivez à <a href="mailto:{publisherEmail}">{publisherEmail}</a> en indiquant l’identifiant d’appareil (visible dans l’extension) ou tout autre élément permettant de retrouver l’enregistrement.`,
      },
      {
        title: "Discord",
        body: `Nowly dialogue avec le client Discord par <strong>IPC local</strong>. Les champs typiques sont le nom de la plateforme, le titre, la chaîne ou l’auteur, l’état lecture/pause et les horodatages. Toute personne pouvant voir votre profil Discord peut voir ce statut. Une fois les données reçues, Discord les traite selon sa propre politique. Voir la <a href="${DISCORD_PRIVACY}">politique de confidentialité de Discord</a>.<br/><br/>L’API peut aussi délivrer un jeton de session (JWT, en principe 30 jours) après une connexion Discord facultative pour des fonctions de compte (par exemple les avis). Le site public n’exige pas de compte. Si vous ne vous connectez jamais, ce jeton n’est pas créé pour vous.`,
      },
      {
        title: "Bases légales (art. 6 RGPD)",
        body: `<ul><li><strong>Statistiques d’usage opt-in</strong> : consentement (art. 6, § 1, a). Vous pouvez le retirer dans l’extension à tout moment, sans remettre en cause la licéité du traitement antérieur.</li><li><strong>Cookie de langue</strong> (site et documentation) : nécessité pour le service demandé et/ou intérêt légitime à mémoriser la langue (art. 6, § 1, b et/ou f).</li><li><strong>Thème et bandeau d’information</strong> (stockage local) : intérêt légitime à une interface utilisable (art. 6, § 1, f).</li><li><strong>Proxy d’images</strong> : intérêt légitime à afficher les visuels du catalogue et de l’activité sans interroger chaque CDN depuis votre navigateur (art. 6, § 1, f).</li><li><strong>Connexion Discord facultative</strong> : exécution de la fonction de compte demandée (art. 6, § 1, b) et, le cas échéant, intérêt légitime à sécuriser l’API (art. 6, § 1, f).</li><li><strong>GitHub, communauté Discord, Ko-fi, GitHub Sponsors</strong> : les données que vous leur adressez relèvent de leurs politiques ; nous lisons les messages publics qui nous sont destinés pour y répondre (art. 6, § 1, b ou f).</li></ul>`,
      },
      {
        title: "Durées de conservation",
        body: `<ul><li><strong>Données locales</strong> (extension et journaux bureau) : jusqu’à suppression, réinitialisation ou désinstallation.</li><li><strong>Cookie de langue</strong> : 1 an, renouvelé si vous changez de langue.</li><li><strong>Statistiques d’usage</strong> : aussi longtemps que nécessaire pour produire des indicateurs agrégés. <strong>Aucune purge automatique à 12 mois</strong> n’est en place aujourd’hui. Vous pouvez demander l’effacement comme indiqué ci-dessus.</li><li><strong>JWT</strong> (si vous vous connectez) : environ 30 jours, sauf déconnexion ou révocation.</li></ul>`,
      },
      {
        title: "Sous-traitants et transferts",
        body: `Nous recourons à :<ul><li><strong>Contabo GmbH</strong> (Allemagne) comme hébergeur du VPS sur lequel tournent le site, l’API et PostgreSQL. L’éditeur administre le serveur. Le traitement a lieu dans l’<strong>{dataRegion}</strong>. Il s’agit d’un hébergement intra-UE, pas d’un transfert vers les États-Unis. <a href="${CONTABO_PRIVACY}">Politique de confidentialité Contabo</a>.</li><li><strong>Cloudflare</strong> pour les fichiers statiques (miniatures, installateurs, archives Canary) et la protection des sites. Les transferts peuvent reposer sur les CCT et, le cas échéant, le Data Privacy Framework UE-États-Unis.</li><li><strong>Google</strong> (Chrome Web Store) et <strong>Mozilla</strong> (Firefox Add-ons) pour la distribution de l’extension.</li><li><strong>Google AdSense</strong> uniquement <strong>si la publicité est activée</strong> sur le site (elle ne l’est pas tant que nous ne l’activons pas). Google agit alors selon ses propres conditions.</li></ul>Si vous définissez une <strong>URL d’API personnalisée</strong>, le trafic va vers le serveur que vous avez choisi. La présente politique ne s’y applique pas.`,
      },
      {
        title: "Proxy d’images",
        body: `Notre API peut récupérer des URL publiques de miniatures (YouTube, Twitch et CDN similaires) pour l’interface. Nous n’utilisons pas ce proxy pour constituer des profils publicitaires. L’URL demandée peut toutefois se rapporter à un titre que vous consultiez. Les journaux de ces requêtes ne sont conservés que pour l’exploitation et la sécurité du service.`,
      },
      {
        title: "Cookies",
        body: `nowly.me et docs.nowly.me déposent chacun un cookie <code>locale</code>. Le thème et le bandeau d’information utilisent le stockage local, pas des cookies. Voir la <a href="/cookies">politique de cookies</a>.`,
      },
      {
        title: "Sécurité",
        body: `Les paquets de présences officiels sont signés (ECDSA P-256). L’extension de production vérifie les signatures avant d’exécuter les présences du catalogue. Les builds Canary distribuées en archive zip sont des versions d’essai et peuvent être non signées. N’installez pas de paquets provenant de sources non fiables.`,
      },
      {
        title: "Vos droits",
        body: `Lorsque le RGPD s’applique, vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité, ainsi que du droit de retirer votre consentement aux statistiques. Les journaux développeur de l’extension peuvent afficher des événements encore présents sur l’appareil ; ce n’est pas un export complet de nos serveurs. Pour exercer vos droits, écrivez à <a href="mailto:{publisherEmail}">{publisherEmail}</a> ou utilisez le <a href="${GH}">dépôt GitHub</a>. Vous pouvez aussi saisir la <a href="${CNIL}">CNIL</a> ou l’autorité de contrôle de votre pays.`,
      },
      {
        title: "Contact",
        body: `Courriel : <a href="mailto:{publisherEmail}">{publisherEmail}</a>. Identification : <a href="/legal-notice">mentions légales</a>.`,
      },
    ],
  },
  "tos-page": {
    badge: "Légal",
    title: "Conditions d’utilisation",
    description: "Les règles d'utilisation de Nowly, de l'extension navigateur, de l'application bureau et du site web.",
    "last-updated": "Dernière mise à jour : 17 septembre 2026.",
    sections: [
      {
        title: "Acceptation",
        body: `En téléchargeant, installant ou utilisant Nowly (extension, application bureau, site, documentation, API et logiciels associés), vous acceptez les présentes conditions. Si vous n’êtes pas d’accord, n’utilisez pas le logiciel. Les droits impératifs des consommateurs restent applicables.`,
      },
      {
        title: "Service",
        body: `Nowly est un outil <strong>gratuit</strong> qui met à jour la Rich Presence Discord à partir de sites pris en charge, via une application bureau locale. Le code source est disponible sur GitHub sous BUSL-1.1 (code source accessible ; ce n’est pas une licence open source OSI tant que la Change Date n’est pas atteinte). Le service comprend :<ul><li>Une extension pour Chromium et Firefox.</li><li>Une application bureau qui dialogue avec Discord sur votre ordinateur.</li><li>Les sites nowly.me et docs.nowly.me.</li><li>Une API publique et un SDK pour créer des présences.</li><li>Des builds Canary facultatives, préversion, éventuellement non signées.</li></ul>`,
      },
      {
        title: "Âge minimum",
        body: `Vous devez avoir au moins <strong>15 ans</strong> et l’âge requis par les conditions de Discord. Si vous n’avez pas l’âge du consentement numérique dans votre pays, l’autorisation d’un titulaire de l’autorité parentale est requise lorsque la loi l’impose.`,
      },
      {
        title: "Licence",
        body: `Nowly est distribué sous <strong>Business Source License 1.1</strong>. Vous pouvez l’utiliser, le copier et le modifier à des fins <strong>personnelles et non commerciales</strong>. Tout usage commercial (revente, offre en tant que service payant ou hébergé) nécessite une licence distincte de l’éditeur. La licence bascule en MIT à la Change Date : quatre ans après la première distribution publique, et en tout état de cause pas avant le <strong>1er juin 2028</strong>. Le texte complet figure dans le <a href="${GH}">dépôt GitHub</a>. Cela ne couvre pas les contenus des plateformes tierces que vous affichez via Nowly.`,
      },
      {
        title: "Usage acceptable",
        body: `Vous devez respecter la loi applicable et les <a href="${DISCORD_TOS}">conditions d’utilisation de Discord</a>. Il est notamment interdit de :<ul><li>afficher via Nowly des contenus illicites, haineux, diffamatoires ou contrefaisants ;</li><li>contourner la sécurité de l’extension, de l’application bureau ou de l’API officielles ;</li><li>distribuer des présences modifiées, falsifiées ou non autorisées via l’infrastructure Nowly ;</li><li>abuser de l’API (requêtes automatisées excessives).</li></ul>Si vous pointez l’extension vers une <strong>URL d’API personnalisée</strong>, vous êtes seul responsable de ce serveur. Notre <a href="/privacy">politique de confidentialité</a> ne s’y applique pas.`,
      },
      {
        title: "Dons",
        body: `Nowly reste utilisable sans paiement. Le soutien volontaire via <a href="${KOFI}">Ko-fi</a> ou <a href="${SPONSORS}">GitHub Sponsors</a> est traité par ces plateformes selon leurs conditions. Un don n’achète pas de fonctionnalité supplémentaire, sauf indication claire au moment du don. Les remboursements suivent les règles de la plateforme et, le cas échéant, les droits impératifs des consommateurs.`,
      },
      {
        title: "Propriété intellectuelle",
        body: `Le code Nowly est licencié comme ci-dessus. Les marques Discord, YouTube, Twitch, Disney+, Apple TV+, Prime Video, TikTok et autres appartiennent à leurs titulaires. Nowly n’est <strong>ni affilié, ni approuvé, ni sponsorisé</strong> par Discord Inc. ni par ces plateformes.`,
      },
      {
        title: "Limitation de responsabilité",
        body: `Nowly est fourni <strong>en l’état</strong>, sans garantie, dans les limites permises par la loi. Nous ne sommes pas responsables des dommages indirects nés de l’usage ou de l’impossibilité d’utiliser le logiciel, y compris les pannes Discord, les sanctions prises par Discord sur votre compte, ou la perte de données locales de l’extension. Rien n’exclut la responsabilité en cas de dol, de faute lourde, d’atteinte à la vie ou à l’intégrité physique, ou de tout cas où le droit français ou européen interdit une telle limitation. Ces clauses ne réduisent pas les droits impératifs des consommateurs.`,
      },
      {
        title: "Confidentialité",
        body: `L’usage de Nowly est également régi par la <a href="/privacy">politique de confidentialité</a> et la <a href="/cookies">politique de cookies</a>.`,
      },
      {
        title: "Modifications",
        body: `Nous pouvons mettre à jour ces conditions en publiant une nouvelle version sur cette page, avec une date de mise à jour. Pour un changement substantiel, nous nous efforcerons d’en informer de façon raisonnable sur le site ou le dépôt. L’usage continu après l’entrée en vigueur vaut acceptation, sauf lorsque la loi exige un accord explicite.`,
      },
      {
        title: "Droit applicable",
        body: `Les présentes conditions sont régies par le <strong>droit français</strong>. À défaut de solution amiable, les tribunaux français sont compétents, sous réserve des règles impératives de compétence protectrices des consommateurs. La <a href="${ODR}">plateforme européenne de règlement en ligne des litiges</a> est disponible.`,
      },
      {
        title: "Contact",
        body: `Courriel : <a href="mailto:{publisherEmail}">{publisherEmail}</a>. Voir les <a href="/legal-notice">mentions légales</a>. GitHub : <a href="${GH}">github.com/nowly-presence/nowly</a>.`,
      },
    ],
  },
  "legal-notice-page": {
    badge: "Légal",
    title: "Mentions légales",
    description: "Éditeur, hébergement et propriété intellectuelle, informations requises par le droit français.",
    "last-updated": "En vigueur depuis le 17 septembre 2026. Mentions requises par la LCEN, art. 6-III.",
    sections: [
      {
        title: "Éditeur",
        body: `Les sites <strong>nowly.me</strong> et <strong>docs.nowly.me</strong>, l’extension navigateur Nowly et l’application bureau sont publiés par :<br/><br/>Éditeur : <strong>{publisherName}</strong><br/>Statut : auto-entrepreneur (micro-entreprise)<br/>SIREN : <strong>{publisherSiren}</strong><br/>Adresse : <strong>{publisherAddress}</strong><br/>TVA : non applicable (franchise en base, art. 293 B du CGI)<br/>Courriel : <a href="mailto:{publisherEmail}">{publisherEmail}</a>`,
      },
      {
        title: "Directeur de la publication",
        body: `<strong>{publisherName}</strong>, en qualité d’éditeur personne physique. Le droit français ne prévoit <strong>qu’un</strong> directeur de la publication (loi du 29 juillet 1881, applicable en ligne). Les contributeurs ou développeurs ne sont pas des directeurs de publication supplémentaires.`,
      },
      {
        title: "Hébergement (site, API, base de données)",
        body: `Le site, l’API et la base PostgreSQL tournent sur un serveur privé virtuel (VPS) loué auprès de :<br/><br/><strong>Contabo GmbH</strong><br/>Welfenstrasse 22<br/>81541 Munich, Allemagne<br/><a href="https://contabo.com">contabo.com</a><br/><a href="${CONTABO_IMPRESSUM}">Mentions légales (Impressum)</a><br/><br/>L’éditeur administre le serveur. Localisation : <strong>{dataRegion}</strong>`,
      },
      {
        title: "CDN et binaires de l’application bureau",
        body: `Les ressources statiques (miniatures, installateurs, archives Canary) sont distribuées via :<br/><br/><strong>Cloudflare, Inc.</strong><br/>101 Townsend Street, San Francisco, CA 94107, États-Unis<br/><a href="https://www.cloudflare.com">cloudflare.com</a>`,
      },
      {
        title: "Distribution de l’extension",
        body: `L’extension de production est distribuée pour <strong>Chrome</strong> (et les autres navigateurs Chromium) via le <strong>Chrome Web Store</strong>, exploité par Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, États-Unis, et pour <strong>Firefox</strong> via <strong>Firefox Add-ons</strong>, exploité par Mozilla Corporation (États-Unis). Des versions d’essai Canary peuvent aussi être proposées en archives zip depuis notre CDN.`,
      },
      {
        title: "Propriété intellectuelle",
        body: `Le code source de Nowly est publié sous <strong>BUSL-1.1</strong> sur <a href="${GH}">github.com/nowly-presence/nowly</a>. Les marques des plateformes tierces restent la propriété de leurs titulaires. <strong>Nowly n’est pas affilié à Discord Inc. ni aux plateformes prises en charge.</strong>`,
      },
      {
        title: "Signalement de contenus illicites",
        body: `Tout contenu manifestement illicite peut être signalé à <a href="mailto:{publisherEmail}">{publisherEmail}</a> en indiquant la date, une description, l’URL et le fondement juridique, conformément à l’article 6 de la LCEN.`,
      },
      {
        title: "Contact",
        body: `Courriel : <a href="mailto:{publisherEmail}">{publisherEmail}</a><br/>GitHub : <a href="${GH}">github.com/nowly-presence/nowly</a>`,
      },
    ],
  },
  "cookies-page": {
    badge: "Cookies",
    title: "Politique de cookies",
    description: "Cookies et stockage local utilisés sur nowly.me et docs.nowly.me.",
    "last-updated": "Dernière mise à jour : 17 septembre 2026.",
    intro: `Cette page décrit les cookies et technologies similaires sur <strong>nowly.me</strong> et <strong>docs.nowly.me</strong>. Nous déposons un cookie de langue. Le thème et le bandeau d’information utilisent le stockage local. Google AdSense n’est chargé que si la publicité est activée.`,
    sections: [
      {
        title: "Cookies strictement nécessaires",
        body: `Le cookie de langue est nécessaire pour mémoriser la locale choisie (ou détectée) sur chaque site. Il ne requiert pas un consentement de type publicitaire au sens des lignes directrices « cookies et autres traceurs », car il est strictement nécessaire à la fourniture du service multilingue.`,
      },
      {
        title: "Cookie locale",
        body: `<strong><code>locale</code></strong> (nowly.me et, séparément, docs.nowly.me)<br/>Finalité : interface en français, anglais ou espagnol.<br/>Durée : 1 an (<code>max-age</code> 31 536 000 secondes), renouvelé si vous changez de langue.<br/>Attributs : cookie déposé par le site, non HttpOnly, SameSite=Lax. La valeur est un code de locale (par exemple <code>fr-FR</code>). Combiné à l’adresse IP dans les journaux serveur, il peut contribuer à identifier un visiteur, même si le cookie lui-même n’est qu’un code de langue.`,
      },
      {
        title: "Stockage local",
        body: `Les sites enregistrent le thème (clair, sombre ou système) et le fait que vous ayez fermé le bandeau. Ces valeurs restent dans le navigateur et ne sont pas envoyées comme cookies à Nowly.`,
      },
      {
        title: "Cookies analytiques",
        body: `Les sites ne déposent <strong>aucun</strong> cookie analytique tiers. Les statistiques d’usage optionnelles, si vous les activez, sont collectées par <strong>l’extension</strong> avec un identifiant d’appareil, pas avec un cookie du site.`,
      },
      {
        title: "Publicité",
        body: `Si nous activons <strong>Google AdSense</strong> sur le site, Google pourra déposer des cookies ou technologies similaires selon sa propre politique. En attendant, Nowly ne dépose pas de cookies publicitaires.`,
      },
      {
        title: "Comment les supprimer",
        body: `Vous pouvez bloquer ou supprimer les cookies dans votre navigateur. Supprimer <code>locale</code> rétablit la langue détectée à la visite suivante.`,
      },
      {
        title: "Contact",
        body: `Courriel : <a href="mailto:{publisherEmail}">{publisherEmail}</a>. Voir les <a href="/legal-notice">mentions légales</a>.`,
      },
    ],
  },
}

locales["es-ES"] = {
  related: {
    tos: {
      title: "Términos del servicio",
      description: "Las reglas para usar Nowly, la extensión de navegador, la app de escritorio y el sitio web.",
    },
  },
  "cookie-banner": {
    message:
      "Este sitio usa una cookie de idioma estrictamente necesaria. Si más adelante se activan anuncios, Google también podrá usar tecnologías publicitarias.",
    "learn-more": "Más información",
    dismiss: "Entendido",
  },
  "privacy-page": {
    badge: "Privacidad",
    title: "Política de privacidad",
    description: "Cómo trata Nowly tus datos, qué permanece en tu dispositivo y qué depende de tu consentimiento.",
    "last-updated": "Última actualización: 17 de septiembre de 2026.",
    intro: `Esta política describe cómo <strong>{publisherName}</strong> («nosotros»), como responsable del tratamiento, trata datos personales en relación con Nowly. La actividad de Rich Presence se envía del navegador al cliente de Discord <strong>en tu equipo</strong>. No pasa por nuestros servidores. Las estadísticas de uso opcionales y algunas funciones del sitio sí implican nuestra API o encargados del tratamiento, como se indica a continuación.`,
    sections: [
      {
        title: "Responsable del tratamiento",
        body: `El responsable es <strong>{publisherName}</strong>, autónomo (microempresa), SIREN {publisherSiren}, {publisherAddress}. Correo: <a href="mailto:{publisherEmail}">{publisherEmail}</a>. La identificación completa está en el <a href="/legal-notice">aviso legal</a>. No se ha designado delegado de protección de datos.`,
      },
      {
        title: "Qué es Nowly",
        body: `Nowly incluye una <strong>extensión de navegador</strong> (Chrome y Firefox), una <strong>app de escritorio</strong> que habla con Discord en local, un <strong>sitio</strong> (nowly.me), <strong>documentación</strong> (<a href="${DOCS}">docs.nowly.me</a>), una <strong>API</strong> pública y builds de prueba <strong>Canary</strong>. La extensión detecta sitios compatibles y, con la app de escritorio, actualiza la Rich Presence de Discord por un canal IPC local.`,
      },
      {
        title: "Datos en tu dispositivo (extensión)",
        body: `La extensión guarda datos en la API de almacenamiento local del navegador (<code>chrome.storage.local</code> en Chromium; equivalente en Firefox). Permanecen en el dispositivo salvo que actives las estadísticas o una URL de API personalizada:<ul><li>Presencias instaladas (metadatos, paquetes firmados, activación).</li><li>Actividad actual (título, plataforma, duración, URL de miniatura).</li><li>Registro de depuración (marcas de tiempo, acciones, URL de sitios reconocidos).</li><li>Estado de bienvenida y una <strong>copia local</strong> del perfil de Discord (ID, nombre, avatar) solo para la interfaz, tomada del cliente local.</li><li>Preferencias, atajos y ajustes por presencia.</li><li>Un identificador de dispositivo (UUID) generado en local, usado si aceptas las estadísticas.</li></ul>Puedes borrar estos datos restableciendo o desinstalando la extensión.`,
      },
      {
        title: "Permisos de la extensión",
        body: `La extensión necesita ciertos permisos:<ul><li><strong>Acceso a sitios</strong> (permiso de host amplio): un script de contenido ligero puede ejecutarse en las páginas que visitas para detectar plataformas compatibles. No se usa para enviarnos tu historial de navegación.</li><li><strong>User Scripts</strong> (Chromium): los scripts de presencia se ejecutan en los sitios coincidentes. Los del catálogo oficial están firmados (ECDSA P-256) y se verifican en local. Los paquetes Canary o cargados a mano no ofrecen las mismas garantías; trátalos como experimentales.</li></ul>`,
      },
      {
        title: "Datos en tu dispositivo (app de escritorio)",
        body: `La app de escritorio puede escribir un registro local <code>nowly-host.log</code> en el directorio de caché NowlyClient, por ejemplo:<ul><li>Windows: <code>%LOCALAPPDATA%\\NowlyClient\\</code></li><li>macOS: <code>~/Library/Caches/NowlyClient/</code></li><li>Linux: <code>~/.cache/NowlyClient/</code></li></ul>El archivo puede incluir marcas de tiempo y detalles de actividad enviados a Discord. Permanece en tu ordenador y no se sube a nuestros servidores. Puedes eliminarlo cuando quieras.`,
      },
      {
        title: "Estadísticas de uso (opt-in)",
        body: `Las estadísticas están <strong>desactivadas por defecto</strong>. Si las activas en la bienvenida o más tarde en ajustes, nuestra API puede recibir:<ul><li>Tu UUID de dispositivo (seudónimo: no es tu cuenta de Discord o Google, pero sigue siendo un dato personal a efectos del RGPD porque identifica tu instalación).</li><li>Navegador, sistema, idioma, versiones de la extensión y de la app de escritorio.</li><li>Identificadores/versiones de presencias instaladas y eventos de uso (instalaciones, latidos, valoraciones) con una carga útil limitada.</li></ul>Las usamos para mejorar Nowly y mostrar la popularidad de las presencias. Desactivar la opción <strong>detiene la recogida</strong> y registra la retirada del consentimiento. <strong>No borra por sí sola</strong> los eventos ya almacenados. Para la supresión en el servidor, escribe a <a href="mailto:{publisherEmail}">{publisherEmail}</a> con el ID de dispositivo (visible en la extensión) u otro dato que permita localizar el registro.`,
      },
      {
        title: "Discord",
        body: `Nowly habla con el cliente de Discord por <strong>IPC local</strong>. Los campos típicos son el nombre de la plataforma, el título, el canal o autor, el estado de reproducción y las marcas de tiempo. Quien pueda ver tu perfil de Discord puede ver ese estado. Una vez recibidos, Discord los trata según su propia política. Consulta la <a href="${DISCORD_PRIVACY}">política de privacidad de Discord</a>.<br/><br/>La API también puede emitir un token de sesión (JWT, en principio 30 días) tras un inicio de sesión opcional con Discord para funciones de cuenta (por ejemplo reseñas). El sitio público no exige cuenta. Si nunca inicias sesión, no creamos ese token para ti.`,
      },
      {
        title: "Bases jurídicas (art. 6 RGPD)",
        body: `<ul><li><strong>Estadísticas opt-in</strong>: consentimiento (art. 6.1.a). Puedes retirarlo en la extensión en cualquier momento, sin afectar a la licitud del tratamiento anterior.</li><li><strong>Cookie de idioma</strong> (sitio y documentación): necesaria para el servicio solicitado y/o interés legítimo en recordar el idioma (art. 6.1.b y/o f).</li><li><strong>Tema y aviso de cookies</strong> (almacenamiento local): interés legítimo en una interfaz usable (art. 6.1.f).</li><li><strong>Proxy de imágenes</strong>: interés legítimo en mostrar las miniaturas del catálogo y de la actividad sin consultar cada CDN desde tu navegador (art. 6.1.f).</li><li><strong>Inicio de sesión opcional con Discord</strong>: ejecución de la función de cuenta solicitada (art. 6.1.b) y, si procede, interés legítimo en asegurar la API (art. 6.1.f).</li><li><strong>GitHub, comunidad Discord, Ko-fi, GitHub Sponsors</strong>: los datos que envías a esos servicios se rigen por sus políticas; leemos los mensajes públicos dirigidos a nosotros para responder (art. 6.1.b o f).</li></ul>`,
      },
      {
        title: "Conservación",
        body: `<ul><li><strong>Datos locales</strong> (extensión y registros de escritorio): hasta que los borres, restablezcas o desinstales.</li><li><strong>Cookie de idioma</strong>: 1 año, renovada al cambiar de idioma.</li><li><strong>Estadísticas de uso</strong>: el tiempo necesario para producir métricas agregadas. <strong>No hay una purga automática a los 12 meses</strong> implementada hoy. Puedes solicitar la supresión como se indica arriba.</li><li><strong>JWT</strong> (si inicias sesión): unos 30 días, salvo cierre de sesión o revocación.</li></ul>`,
      },
      {
        title: "Encargados y transferencias",
        body: `Recurrimos a:<ul><li><strong>Contabo GmbH</strong> (Alemania) como proveedor del VPS en el que ejecutamos el sitio, la API y PostgreSQL. El editor administra el servidor. El tratamiento tiene lugar en la <strong>{dataRegion}</strong>. Es un alojamiento intra-UE, no una transferencia a Estados Unidos. <a href="${CONTABO_PRIVACY}">Política de privacidad de Contabo</a>.</li><li><strong>Cloudflare</strong> para archivos estáticos (miniaturas, instaladores, zips Canary) y la protección de los sitios. Las transferencias pueden basarse en las CCT y, en su caso, el Marco de Privacidad de Datos UE-EE. UU.</li><li><strong>Google</strong> (Chrome Web Store) y <strong>Mozilla</strong> (Firefox Add-ons) para distribuir la extensión.</li><li><strong>Google AdSense</strong> solo <strong>si la publicidad está activada</strong> en el sitio (no lo está mientras no la activemos). Google actúa entonces según sus propios términos.</li></ul>Si configuras una <strong>URL de API personalizada</strong>, el tráfico va al servidor que hayas elegido. Esta política no se aplica a ese servidor.`,
      },
      {
        title: "Proxy de imágenes",
        body: `Nuestra API puede obtener URL públicas de miniaturas (YouTube, Twitch y CDN similares) para la interfaz. No usamos el proxy para perfiles publicitarios. La URL solicitada puede relacionarse con un título que estuvieras viendo. Los registros de esas peticiones se conservan solo para operar y proteger el servicio.`,
      },
      {
        title: "Cookies",
        body: `nowly.me y docs.nowly.me establecen cada uno una cookie <code>locale</code>. El tema y el aviso de cookies usan almacenamiento local, no cookies. Consulta la <a href="/cookies">política de cookies</a>.`,
      },
      {
        title: "Seguridad",
        body: `Los paquetes oficiales de presencias están firmados (ECDSA P-256). La extensión de producción verifica las firmas antes de ejecutar las presencias del catálogo. Las builds Canary en zip son software de prueba y pueden no estar firmadas. No instales paquetes de fuentes no fiables.`,
      },
      {
        title: "Tus derechos",
        body: `Si aplica el RGPD, puedes solicitar acceso, rectificación, supresión, limitación, oposición y portabilidad, y retirar el consentimiento de las estadísticas. Los diagnósticos de desarrollador de la extensión pueden mostrar eventos aún en el dispositivo; no son una exportación completa de nuestros servidores. Para ejercer derechos, escribe a <a href="mailto:{publisherEmail}">{publisherEmail}</a> o usa el <a href="${GH}">repositorio de GitHub</a>. También puedes reclamar ante la <a href="${CNIL}">CNIL</a> (Francia) o tu autoridad de control.`,
      },
      {
        title: "Contacto",
        body: `Correo: <a href="mailto:{publisherEmail}">{publisherEmail}</a>. Datos del editor: <a href="/legal-notice">aviso legal</a>.`,
      },
    ],
  },
  "tos-page": {
    badge: "Legal",
    title: "Términos del servicio",
    description: "Las reglas para usar Nowly, la extensión de navegador, la app de escritorio y el sitio web.",
    "last-updated": "Última actualización: 17 de septiembre de 2026.",
    sections: [
      {
        title: "Aceptación",
        body: `Al descargar, instalar o usar Nowly (extensión, app de escritorio, sitio, documentación, API y software asociado), aceptas estos términos. Si no estás de acuerdo, no uses el software. Los derechos imperativos de los consumidores no se ven afectados.`,
      },
      {
        title: "Servicio",
        body: `Nowly es una herramienta <strong>gratuita</strong> que actualiza la Rich Presence de Discord desde sitios compatibles, mediante una app de escritorio local. El código fuente está en GitHub bajo BUSL-1.1 (código accesible; no es una licencia de código abierto OSI hasta la Change Date). El servicio incluye:<ul><li>Una extensión para Chromium y Firefox.</li><li>Una app de escritorio que habla con Discord en tu ordenador.</li><li>Los sitios nowly.me y docs.nowly.me.</li><li>Una API pública y un SDK para crear presencias.</li><li>Builds Canary opcionales, previas a la versión estable, que pueden no estar firmadas.</li></ul>`,
      },
      {
        title: "Edad mínima",
        body: `Debes tener al menos <strong>15 años</strong> y la edad exigida por los términos de Discord. Si no has alcanzado la edad digital de consentimiento en tu país, se requiere permiso de un tutor cuando la ley lo imponga.`,
      },
      {
        title: "Licencia",
        body: `Nowly se licencia bajo la <strong>Business Source License 1.1</strong>. Puedes usarlo, copiarlo y modificarlo con fines <strong>personales y no comerciales</strong>. El uso comercial (reventa u ofrecerlo como servicio de pago o alojado) requiere una licencia aparte del editor. La licencia pasa a MIT en la Change Date: cuatro años después de la primera distribución pública, y en ningún caso antes del <strong>1 de junio de 2028</strong>. El texto completo está en el <a href="${GH}">repositorio de GitHub</a>. Esto no cubre el contenido de plataformas de terceros que muestres con Nowly.`,
      },
      {
        title: "Uso aceptable",
        body: `Debes cumplir la ley aplicable y los <a href="${DISCORD_TOS}">términos de Discord</a>. No debes:<ul><li>usar Nowly para mostrar contenido ilícito, de odio, difamatorio o que vulnere derechos;</li><li>eludir la seguridad de la extensión, la app de escritorio o la API oficiales;</li><li>distribuir presencias modificadas, falsificadas o no autorizadas por la infraestructura de Nowly;</li><li>abusar de la API (peticiones automáticas excesivas).</li></ul>Si apuntas la extensión a una <strong>URL de API personalizada</strong>, eres el único responsable de ese servidor. Nuestra <a href="/privacy">política de privacidad</a> no lo cubre.`,
      },
      {
        title: "Donaciones",
        body: `Nowly sigue siendo usable sin pago. El apoyo voluntario vía <a href="${KOFI}">Ko-fi</a> o <a href="${SPONSORS}">GitHub Sponsors</a> lo procesan esas plataformas según sus términos. Una donación no compra funciones extra salvo que lo indiquemos claramente. Los reembolsos siguen las reglas de la plataforma y, en su caso, los derechos imperativos del consumidor.`,
      },
      {
        title: "Propiedad intelectual",
        body: `El código de Nowly se licencia como arriba. Discord, YouTube, Twitch, Disney+, Apple TV+, Prime Video, TikTok y demás marcas pertenecen a sus titulares. Nowly <strong>no está afiliado, respaldado ni patrocinado</strong> por Discord Inc. ni por esas plataformas.`,
      },
      {
        title: "Limitación de responsabilidad",
        body: `Nowly se proporciona <strong>«tal cual»</strong>, sin garantía, en la medida permitida por la ley. No respondemos de daños indirectos derivados del uso o la imposibilidad de uso, incluidos fallos de Discord, sanciones de Discord sobre tu cuenta o pérdida de datos locales de la extensión. Nada excluye la responsabilidad por dolo, culpa grave, muerte o lesiones, ni cualquier responsabilidad que el derecho francés o de la UE no permita limitar. Estas cláusulas no reducen los derechos imperativos de los consumidores.`,
      },
      {
        title: "Privacidad",
        body: `El uso de Nowly también se rige por la <a href="/privacy">política de privacidad</a> y la <a href="/cookies">política de cookies</a>.`,
      },
      {
        title: "Cambios",
        body: `Podemos actualizar estos términos publicando una nueva versión en esta página, con una fecha de actualización. Ante un cambio sustancial, intentaremos avisar de forma razonable en el sitio o el repositorio. El uso continuado tras la entrada en vigor implica aceptación, salvo cuando la ley exija un acuerdo explícito.`,
      },
      {
        title: "Ley aplicable",
        body: `Estos términos se rigen por el <strong>derecho francés</strong>. Si no hay solución amistosa, serán competentes los tribunales franceses, sin perjuicio de las normas imperativas de competencia protectoras del consumidor. Está disponible la <a href="${ODR}">plataforma de resolución de litigios en línea de la UE</a>.`,
      },
      {
        title: "Contacto",
        body: `Correo: <a href="mailto:{publisherEmail}">{publisherEmail}</a>. Véase el <a href="/legal-notice">aviso legal</a>. GitHub: <a href="${GH}">github.com/nowly-presence/nowly</a>.`,
      },
    ],
  },
  "legal-notice-page": {
    badge: "Legal",
    title: "Aviso legal",
    description: "Editor, alojamiento y propiedad intelectual, información exigida por la ley francesa.",
    "last-updated": "En vigor desde el 17 de septiembre de 2026. Exigido por la LCEN francesa, art. 6-III.",
    sections: [
      {
        title: "Editor",
        body: `Los sitios <strong>nowly.me</strong> y <strong>docs.nowly.me</strong>, la extensión de navegador Nowly y la app de escritorio son publicados por:<br/><br/>Editor: <strong>{publisherName}</strong><br/>Situación: autónomo (microempresa)<br/>SIREN: <strong>{publisherSiren}</strong><br/>Dirección: <strong>{publisherAddress}</strong><br/>IVA: no aplicable (exención, art. 293 B del CGI francés)<br/>Correo: <a href="mailto:{publisherEmail}">{publisherEmail}</a>`,
      },
      {
        title: "Director de publicación",
        body: `<strong>{publisherName}</strong>, en calidad de editor persona física. El derecho francés prevé un <strong>único</strong> director de publicación (ley de 29 de julio de 1881, aplicable en línea). Los colaboradores o desarrolladores no son directores de publicación adicionales.`,
      },
      {
        title: "Alojamiento (sitio, API, base de datos)",
        body: `El sitio, la API y PostgreSQL se ejecutan en un servidor privado virtual (VPS) alquilado a:<br/><br/><strong>Contabo GmbH</strong><br/>Welfenstrasse 22<br/>81541 Múnich, Alemania<br/><a href="https://contabo.com">contabo.com</a><br/><a href="${CONTABO_IMPRESSUM}">Aviso legal (Impressum)</a><br/><br/>El editor administra el servidor. Ubicación: <strong>{dataRegion}</strong>`,
      },
      {
        title: "CDN y binarios de escritorio",
        body: `Los recursos estáticos (miniaturas, instaladores, archivos Canary) se distribuyen a través de:<br/><br/><strong>Cloudflare, Inc.</strong><br/>101 Townsend Street, San Francisco, CA 94107, Estados Unidos<br/><a href="https://www.cloudflare.com">cloudflare.com</a>`,
      },
      {
        title: "Distribución de la extensión",
        body: `La extensión de producción se distribuye para <strong>Chrome</strong> (y otros navegadores Chromium) a través de la <strong>Chrome Web Store</strong>, gestionada por Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, Estados Unidos, y para <strong>Firefox</strong> a través de <strong>Firefox Add-ons</strong>, operado por Mozilla Corporation (Estados Unidos). También pueden ofrecerse builds Canary de prueba como archivos zip desde nuestro CDN.`,
      },
      {
        title: "Propiedad intelectual",
        body: `El código fuente de Nowly se publica bajo <strong>BUSL-1.1</strong> en <a href="${GH}">github.com/nowly-presence/nowly</a>. Las marcas de terceros siguen siendo de sus titulares. <strong>Nowly no está afiliado a Discord Inc. ni a las plataformas compatibles.</strong>`,
      },
      {
        title: "Contenido ilícito",
        body: `El contenido manifiestamente ilícito puede notificarse a <a href="mailto:{publisherEmail}">{publisherEmail}</a> indicando fecha, descripción, URL y fundamento jurídico, conforme al artículo 6 de la LCEN.`,
      },
      {
        title: "Contacto",
        body: `Correo: <a href="mailto:{publisherEmail}">{publisherEmail}</a><br/>GitHub: <a href="${GH}">github.com/nowly-presence/nowly</a>`,
      },
    ],
  },
  "cookies-page": {
    badge: "Cookies",
    title: "Política de cookies",
    description: "Cookies y almacenamiento local usados en nowly.me y docs.nowly.me.",
    "last-updated": "Última actualización: 17 de septiembre de 2026.",
    intro: `Esta página describe las cookies y tecnologías similares en <strong>nowly.me</strong> y <strong>docs.nowly.me</strong>. Establecemos una cookie de idioma. El tema y el aviso de cookies usan almacenamiento local. Google AdSense no se carga salvo que la publicidad esté activada.`,
    sections: [
      {
        title: "Estrictamente necesarias",
        body: `La cookie de idioma es necesaria para recordar el locale elegido (o detectado) en cada sitio. No exige un consentimiento de tipo publicitario, porque es estrictamente necesaria para prestar el servicio multilingüe.`,
      },
      {
        title: "Cookie locale",
        body: `<strong><code>locale</code></strong> (nowly.me y, por separado, docs.nowly.me)<br/>Finalidad: interfaz en francés, inglés o español.<br/>Duración: 1 año (<code>max-age</code> 31.536.000 segundos), renovada al cambiar de idioma.<br/>Atributos: de origen, no HttpOnly, SameSite=Lax. El valor es un código de locale (por ejemplo <code>es-ES</code>). Combinada con la IP en los registros del servidor puede contribuir a identificar a un visitante, aunque la cookie solo contenga un código de idioma.`,
      },
      {
        title: "Almacenamiento local",
        body: `Los sitios guardan el tema (claro, oscuro o sistema) y si cerraste el aviso. Esos valores permanecen en el navegador y no se envían como cookies a Nowly.`,
      },
      {
        title: "Cookies analíticas",
        body: `Los sitios <strong>no</strong> establecen cookies analíticas de terceros. Las estadísticas de uso opcionales, si las activas, las recoge la <strong>extensión</strong> con un ID de dispositivo, no con una cookie del sitio.`,
      },
      {
        title: "Publicidad",
        body: `Si activamos <strong>Google AdSense</strong> en el sitio, Google podrá establecer cookies o tecnologías similares según su propia política. Hasta entonces, Nowly no coloca cookies publicitarias.`,
      },
      {
        title: "Cómo eliminarlas",
        body: `Puedes bloquear o eliminar cookies en tu navegador. Borrar <code>locale</code> restablece el idioma detectado en la siguiente visita.`,
      },
      {
        title: "Contacto",
        body: `Correo: <a href="mailto:{publisherEmail}">{publisherEmail}</a>. Véase el <a href="/legal-notice">aviso legal</a>.`,
      },
    ],
  },
}

function assertNoBanned(str, label) {
  if (str.includes("\u2014") || str.includes("\u2013")) {
    throw new Error(`em/en dash in ${label}`)
  }
  if (str.includes("·")) {
    throw new Error(`middle dot in ${label}`)
  }
}

for (const [file, data] of Object.entries(locales)) {
  const path = join(root, "messages", `${file}.json`)
  const json = JSON.parse(readFileSync(path, "utf8"))
  if (json.pages?.tos) {
    json.pages.tos = { ...json.pages.tos, ...data.related.tos }
  }
  if (json.footer?.tos) {
    json.footer.tos = data["tos-page"].title
  }
  json["cookie-banner"] = data["cookie-banner"]
  json["privacy-page"] = data["privacy-page"]
  json["tos-page"] = data["tos-page"]
  json["legal-notice-page"] = data["legal-notice-page"]
  json["cookies-page"] = data["cookies-page"]
  const text = JSON.stringify(json, null, 2) + "\n"
  assertNoBanned(text, file)
  writeFileSync(path, text)
  console.log("patched", file)
}

void CONTACT
