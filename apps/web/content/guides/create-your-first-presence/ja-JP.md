---
title: 初めてのNowlyプレゼンスを作る
description: 空のフォルダーからDiscordにアクティビティを表示するまで、必要なツール、プレゼンスのファイル、最初のスクリプト、ローカルでのテスト、公開方法を説明します。
category: developers
order: 1
updated: 2026-10-09
related: what-is-discord-rich-presence, allow-user-scripts, nowly-vs-premid
---

Nowlyライブラリの各プラットフォームは、誰かがプレゼンスを作ったことで使えるようになりました。使いたいサイトがまだないなら、自分で追加できます。プレゼンスは小さなTypeScriptプロジェクトで、最初のバージョンなら通常100行未満です。Nowly CLIがひな形の作成、ビルド、ローカルでのテストを支援します。このガイドでは何もない状態から、Discordのステータスを更新するプレゼンスを作ります。完全なリファレンスは[Nowlyのドキュメント](https://docs.nowly.me/)をご覧ください。

## 必要なもの

- **Node.js 22以降**と**pnpm**：CLIの実行とプレゼンスのビルドに使います。
- **Git**：プレゼンスのリポジトリを複製し、プルリクエストを作成します。
- **Chromium系ブラウザまたはFirefox**、**Discordデスクトップアプリ**、およびインストール済みの[Nowlyデスクトップアプリ](/desktop)：実際の動作確認に使います。
- JavaScriptまたはTypeScriptの基本知識と、対象ページを調べるためのブラウザ開発者ツール。

## リポジトリとCLIを入手

コミュニティのプレゼンスはすべて、MITライセンスの公開リポジトリにあります。

```bash
git clone https://github.com/nowly-presence/presences.git
cd presences
pnpm install
pnpm i -g @nowly/cli
```

`pnpm install`では`@nowly/sdk`パッケージもリンクされ、エディターでPresence APIの型を参照できるようになります。

## プレゼンスのひな形を作る

```bash
nowly init "Example"
```

CLIがいくつか質問した後、プラットフォーム名の頭文字に対応する`src/E/Example/`以下にフォルダーを作ります。

- `metadata.json`：プレゼンスの名前、作者、対応アドレス、カテゴリー、色、説明文、設定を記載します。
- `presence.ts`：ページを読み、アクティビティを設定するコードです。
- `locales/`：Discordに表示する文章を、言語ごとのファイルにまとめます。
- `assets/`：Discordやライブラリで使用するロゴ、アイコン、サムネイルです。

CLIは、そのプラットフォームがアカウント連携によってすでにDiscordに表示されるかも尋ねます。該当する場合は、ライブラリで利用者に知らせられるよう、プレゼンスに印を付けます。

## metadata.jsonにプラットフォームを記述

最も重要なのはアドレスの項目です。`url`にはホスト名を列挙し、`regExp`にはプレゼンスを動かすページのアドレスに一致するパターンを指定します。サイトの仕様が許す限り対象を絞ってください。理解できないページでプレゼンスを実行してはいけません。

`category`は`streaming`、`music`、`video`、`social`、`gaming`、`tools`、`ai`、`learning`、`creator`、`other`から一つ選びます。説明文は言語ごとに書き、英語が代替言語になります。

## 最初のプレゼンスを書く

`Presence`と`Assets`は実行環境から提供されます。SDKからインポートするのは`PresenceType`などのヘルパーだけです。

```ts
import { PresenceType } from "@nowly/sdk"

const presence = new Presence()

presence.on("UpdateData", async () => {
  await presence.setActivity({
    details: document.title,
    state: document.location.hostname,
    largeImageKey: Assets.Logo,
    type: PresenceType.Watching,
  })
})
```

`UpdateData`はページを開いている間、定期的に発生し、利用者が設定を変更したときにも発生します。そのたびにページを読んでアクティビティを送ります。表示する価値のある情報がない場合は、空のステータスを送る代わりに`presence.clearActivity()`を呼び出してください。

メディア用には、SDKの`createMediaTimestamps(video)`を使うと、`audio`または`video`要素からDiscordの進行状況バーに必要な開始時刻・終了時刻を取得できます。

## 利用者を尊重する

ライブラリのプレゼンスには、利用者が期待するいくつかのルールがあります。

- 閲覧するページすべてではなく、実際にしていることを表示します。閲覧中のページは初期設定でオフの**閲覧中のアクティビティを表示**設定の対象にしてください。
- 個人的な内容が含まれる場合は、タイトルを隠すモードや、非公開の会話をDiscordへ送らない設定を用意します。
- アクティビティ以外の送信先にデータを送らず、アクティビティに不要な情報を読み取らないでください。
- Discordに表示するすべての文章には`locales/`の翻訳文字列を使ってください。

## ローカルでビルドして試す

まずメタデータと画像を検証し、ビルドします。

```bash
nowly validate
nowly build example
```

まだブラウザにNowlyをインストールしていないなら、プレゼンスを開発用の拡張機能に組み込めます。

```bash
nowly extension example
nowly extension example --firefox
```

Chromeでは**デベロッパーモード**をオンにして`chrome://extensions`から`dist/extension-dev`をパッケージ化されていない拡張機能として読み込みます。Firefoxでは`about:debugging`から`dist/extension-dev-firefox/manifest.json`を一時的なアドオンとして読み込みます。対象のサイトを開けば、Discordのステータスが変化するはずです。

すでにNowlyの開発用ビルドをパッケージ化せずに読み込んでいるなら、zipファイルでより速く変更を試せます。

```bash
nowly pack example
```

作成された`dist/packs/example.zip`を、拡張機能の**設定**、**詳細設定**、**デバッグ**の順に開いて追加します。未署名zipを受け入れるのはパッケージ化されていないビルドだけで、ストア版では受け入れません。

## 公開する

1. 最後にもう一度`nowly validate`を実行し、何も再生されていない場合も含め、実際のページをいくつか開いてプレゼンスを確認します。
2. プレゼンスのリポジトリで、短い説明とDiscordのステータスのスクリーンショットを添えてプルリクエストを作成します。
3. チームがコードをレビューし、リリースに署名してライブラリで公開します。その後は誰でもワンクリックでインストールでき、ライブラリのページにあなたが作者として表示されます。

## さらに学ぶ

ドキュメントにはPresence API全体のほか、設定、翻訳、時間情報、iframe、Discordが直接読み込めないアートワーク用の画像プロキシも記載されています。[初めてのプレゼンスを作る](https://docs.nowly.me/presence-development/creating-your-first-presence)から始め、プルリクエストを作る前には[貢献ガイドライン](https://docs.nowly.me/publishing/contribution-guidelines)も確認してください。
