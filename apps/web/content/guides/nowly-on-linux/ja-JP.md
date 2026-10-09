---
title: LinuxでNowlyを使う方法（.deb、アーカイブ、Flatpak、Snap）
description: どのディストリビューションでもNowlyデスクトップアプリをインストールし、「更新があります」の繰り返しを解消し、FlatpakやSnap版のDiscordまたはブラウザでRich Presenceを使う方法を説明します。
category: troubleshooting
order: 3
updated: 2026-10-09
related: rich-presence-not-showing, set-up-nowly, what-is-discord-rich-presence
---

LinuxでもNowlyの基本はWindowsやmacOSと同じです。ブラウザ拡張機能がアクティビティを検出し、デスクトップアプリが同じパソコンのDiscordアプリへ渡します。ただしLinuxには複数のインストール方法があり、サンドボックス化されたパッケージが通信を妨げることもあります。このガイドでは、各種ディストリビューションへの導入と、Linuxで実際に遭遇しやすい問題への対処を説明します。

## 動作環境

- glibc 2.17以降を備える64ビット（x64）のディストリビューション。現在の主要なディストリビューションはすべて該当します。
- Discord公式の`.deb`、公式アーカイブ、ディストリビューションのパッケージ、Flatpak、Snapのいずれかで導入したDiscordデスクトップアプリ。
- Chrome、Chromium、Brave、Edge、Opera、Firefoxのいずれか。可能ならディストリビューションのリポジトリ、または提供元のパッケージからインストールしたもの。

## 適切なダウンロードを選ぶ

[デスクトップアプリのページ](/desktop)では、Linux向けに二つのファイルを提供しています。

- **`.deb`パッケージ**：Debian、Ubuntu、Linux Mint、Pop!_OS、elementary OSなど、Debian系のシステム向けです。システム全体にアプリをインストールし、対応するすべてのブラウザに登録します。
- **`.tar.gz`アーカイブ**：Fedora、Arch、openSUSEなど、そのほかの環境向けです。アプリ本体と、現在のユーザー向けに登録するインストールスクリプトが含まれます。

## .debパッケージをインストール

多くのデスクトップ環境では、ファイルをダブルクリックするとパッケージインストーラーが開きます。Thunarを使うXFCEなど、グラフィカルなパッケージインストーラーが設定されていない環境では、ダブルクリックしても何も起きない場合があります。その場合はターミナルからインストールしてください。

```bash
sudo dpkg -i ~/Downloads/nowly-host.deb
```

続いて、実際にインストールされたか確認します。

```bash
dpkg -L nowly-host
```

一覧に`/usr/lib/nowly-client/nowly-host`が含まれるはずです。ブラウザが新しいアプリを見つけられるよう、タブだけでなくブラウザ全体を再起動します。

## アーカイブからインストール

アーカイブを展開し、展開したフォルダーでターミナルを開き、中にあるインストールスクリプトを実行します。スクリプトの出力に表示される案内に従ってください。アプリをホームディレクトリにコピーし、ブラウザにアプリの場所を伝える小さなマニフェストファイルを作成します。Chromeでは`~/.config/google-chrome/NativeMessagingHosts/nowly.client.json`、Firefoxでは`~/.mozilla/native-messaging-hosts/nowly.client.json`などです。その後ブラウザを再起動してください。

## インストール直後に「更新があります」と表示される

最新版をインストールしたばかりなのに、Nowlyのサイドパネルにデスクトップアプリの更新があると表示された場合は、次の二つを順に確認します。

1. **`.deb`が実際にはインストールされていない。** `dpkg -L nowly-host`を実行します。パッケージがインストールされていないと表示されたら、上記の方法でターミナルからインストールしてください。
2. **古いユーザー単位のインストールが優先されている。** アーカイブ版から`.deb`に切り替えた場合、ホームディレクトリに残った古いマニフェストが旧アプリを指している可能性があります。削除してください。

```bash
rm -f ~/.mozilla/native-messaging-hosts/nowly.client.json
rm -f ~/.config/*/NativeMessagingHosts/nowly.client.json
rm -f ~/.local/share/NowlyClient/nowly-host
```

その後、ブラウザを完全に終了して開き直し、新しい場所のデスクトップアプリを起動させます。

## FlatpakまたはSnapでDiscordをインストールした場合

サンドボックス版のDiscordは、Rich Presence用ソケットを通常の場所ではなく、サンドボックス内のフォルダーに作ります。Nowlyデスクトップアプリは`$XDG_RUNTIME_DIR`、`$TMPDIR`、`/tmp`にある`discord-ipc-0`から`discord-ipc-9`を探すため、Flatpak版やSnap版のDiscordを見つけられない場合があります。ほかのRich Presenceツールでも同様で、実際のソケットから通常の場所へシンボリックリンクを張るのが一般的な対処法です。

**Flathub版Discord**では、ソケットは`$XDG_RUNTIME_DIR/app/com.discordapp.Discord/`にあります。次のコマンドでリンクを作ります。

```bash
ln -sf "$XDG_RUNTIME_DIR/app/com.discordapp.Discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

`$XDG_RUNTIME_DIR`は再起動のたびに空になるため、リンクも消えます。ログイン時に自動で再作成するにはsystemdを使います。

```bash
mkdir -p ~/.config/user-tmpfiles.d
echo 'L %t/discord-ipc-0 - - - - app/com.discordapp.Discord/discord-ipc-0' > ~/.config/user-tmpfiles.d/discord-rpc.conf
systemctl --user enable --now systemd-tmpfiles-setup.service
```

**Snap Store版Discord**では、通常`$XDG_RUNTIME_DIR/snap.discord/`にソケットがあります。同様にリンクを作れます。

```bash
ln -sf "$XDG_RUNTIME_DIR/snap.discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

リンクを作る前にDiscordを起動し、その後Nowlyのサイドパネルで**接続を確認**をクリックしてください。

## FlatpakまたはSnapでブラウザをインストールした場合

ブラウザはネイティブメッセージングを使ってNowlyデスクトップアプリを起動します。サンドボックス化されたブラウザでは起動できるプログラムが制限され、パッケージやバージョンによってはネイティブメッセージング自体が完全にブロックされます。その場合、何をインストールしても**Nowly Desktopを検出**が緑色になりません。

確実な対処法は、Flatpak版やSnap版ではなく、ディストリビューションのリポジトリやブラウザ提供元の`.deb`・`.rpm`パッケージからインストールしたブラウザを使うことです。ブラウザのアカウントにログインすれば、ブックマークやパスワードを復元できます。

## 通知とログ

権限の問題でDiscordが接続を拒否した場合、デスクトップ環境に通知サービスがあれば、デスクトップアプリは`notify-send`で通知を表示できます。

デスクトップアプリのログは`~/.cache/NowlyClient/nowly-host.log`に書き込まれます。Discordへ送信したアクティビティが含まれる場合があるため、サポートへの問い合わせで共有する前に内容を確認してください。ログはいつでも削除できます。

## チェックリスト

- `dpkg -L nowly-host`でアプリが表示されるか、アーカイブのインストールスクリプトがエラーなく完了している。
- 古いインストールのマニフェストが残っていない。
- Discordが起動しており、ソケットに`$XDG_RUNTIME_DIR`または`/tmp`からアクセスできる。
- ブラウザがFlatpak版・Snap版ではないか、使っているブラウザでネイティブメッセージングが動く。

四つとも満たしてもNowlyがDiscordに接続できない場合は、[トラブルシューティングのチェックリスト](/guides/rich-presence-not-showing)に沿って確認し、ディストリビューション、デスクトップ環境、Discordとブラウザのインストール方法を添えて、NowlyのDiscordサーバーでチケットを作成してください。
