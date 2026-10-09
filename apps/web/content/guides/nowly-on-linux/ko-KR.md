---
title: "Linux에서 Nowly 사용하기: .deb, 압축 파일, Flatpak, Snap"
description: 모든 배포판에서 Nowly 데스크톱 앱을 설치하고, 설치 직후 반복되는 업데이트 안내를 해결하며, Flatpak·Snap으로 설치한 Discord나 브라우저에서 Rich Presence를 작동시키는 방법입니다.
category: troubleshooting
order: 3
updated: 2026-10-09
related: rich-presence-not-showing, set-up-nowly, what-is-discord-rich-presence
---

Nowly는 Linux에서도 Windows나 macOS와 같은 방식으로 작동합니다. 브라우저 확장 프로그램이 활동을 감지하고 데스크톱 앱이 같은 컴퓨터의 Discord 앱에 전달합니다. 다만 Linux에는 설치 방식이 다양하고 샌드박스 패키지 때문에 연결이 막힐 수 있습니다. 이 가이드에서는 여러 배포판의 설치 방법과 Linux에서 실제로 발생하는 문제의 해결책을 다룹니다.

## 요구 사항

- glibc 2.17 이상을 사용하는 64비트(x64) 배포판. 현재 널리 쓰이는 배포판은 모두 해당합니다.
- Discord의 `.deb`, 공식 압축 파일, 배포판 패키지, Flatpak 또는 Snap으로 설치한 Discord 데스크톱 앱.
- Chrome, Chromium, Brave, Edge, Opera 또는 Firefox. 가능하면 배포판 저장소나 제조사 자체 패키지로 설치하세요.

## 알맞은 파일 고르기

[데스크톱 앱 페이지](/desktop)에서는 Linux용 파일을 두 가지 제공합니다.

- **`.deb` 패키지**: Debian, Ubuntu, Linux Mint, Pop!_OS, elementary OS 등 Debian 기반 배포판용입니다. 시스템 전체에 앱을 설치하고 지원 브라우저 모두에 등록합니다.
- **`.tar.gz` 압축 파일**: Fedora, Arch, openSUSE 등 나머지 배포판용입니다. 앱과 사용자 계정에 등록하는 설치 스크립트가 들어 있습니다.

## .deb 패키지 설치하기

대부분의 데스크톱에서는 파일을 두 번 클릭하면 소프트웨어 설치 프로그램이 열립니다. XFCE에서 Thunar를 사용하는 경우처럼 그래픽 패키지 설치 프로그램이 설정되어 있지 않으면 두 번 클릭해도 아무 일도 일어나지 않을 수 있습니다. 이때는 터미널에서 설치하세요.

```bash
sudo dpkg -i ~/Downloads/nowly-host.deb
```

실제로 설치됐는지 확인하세요.

```bash
dpkg -L nowly-host
```

목록에 `/usr/lib/nowly-client/nowly-host`가 있어야 합니다. 새 앱을 찾을 수 있도록 탭만이 아니라 브라우저를 완전히 다시 시작하세요.

## 압축 파일로 설치하기

압축을 풀고 해당 폴더에서 터미널을 열어 안에 들어 있는 설치 스크립트를 실행하세요. 스크립트에서 출력하는 안내를 따르세요. 앱을 홈 디렉터리로 복사하고, 브라우저가 앱을 찾도록 하는 작은 매니페스트 파일을 작성합니다. Chrome에서는 `~/.config/google-chrome/NativeMessagingHosts/nowly.client.json`, Firefox에서는 `~/.mozilla/native-messaging-hosts/nowly.client.json` 같은 파일입니다. 완료 후 브라우저를 다시 시작하세요.

## 설치 직후에도 '업데이트 있음'이 표시된다면

최신 데스크톱 앱을 방금 설치했는데 Nowly 사이드 패널에 업데이트가 있다고 나오면 다음 두 가지 원인을 순서대로 확인하세요.

1. **`.deb`가 설치되지 않았습니다.** `dpkg -L nowly-host`를 실행하세요. 패키지가 설치되지 않았다고 나오면 위 방법대로 터미널에서 설치하세요.
2. **오래된 사용자별 설치가 우선 적용되고 있습니다.** 압축 파일을 사용하다가 `.deb`로 바꿨다면 홈 디렉터리의 옛 매니페스트가 이전 앱을 계속 가리킵니다. 다음 파일을 제거하세요.

```bash
rm -f ~/.mozilla/native-messaging-hosts/nowly.client.json
rm -f ~/.config/*/NativeMessagingHosts/nowly.client.json
rm -f ~/.local/share/NowlyClient/nowly-host
```

그런 다음 브라우저를 완전히 종료하고 다시 열어 새 위치의 데스크톱 앱을 실행하게 하세요.

## Flatpak 또는 Snap으로 설치한 Discord

샌드박스 버전 Discord는 Rich Presence 소켓을 일반적인 위치가 아닌 자체 샌드박스 폴더에 만듭니다. Nowly 데스크톱 앱은 `$XDG_RUNTIME_DIR`, `$TMPDIR`, `/tmp`에서 `discord-ipc-0`부터 `discord-ipc-9`까지 찾으므로 Flatpak·Snap Discord의 소켓을 놓칠 수 있습니다. 다른 Rich Presence 도구도 같은 문제가 있으며, 예상 위치에서 실제 소켓으로 향하는 심볼릭 링크를 만드는 것이 일반적인 해결책입니다.

**Flathub에서 설치한 Discord**의 소켓은 `$XDG_RUNTIME_DIR/app/com.discordapp.Discord/`에 있습니다. 다음 명령으로 링크를 만드세요.

```bash
ln -sf "$XDG_RUNTIME_DIR/app/com.discordapp.Discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

`$XDG_RUNTIME_DIR`는 재부팅 때마다 비워져 링크도 사라집니다. 로그인할 때마다 자동으로 다시 만들려면 systemd를 사용하세요.

```bash
mkdir -p ~/.config/user-tmpfiles.d
echo 'L %t/discord-ipc-0 - - - - app/com.discordapp.Discord/discord-ipc-0' > ~/.config/user-tmpfiles.d/discord-rpc.conf
systemctl --user enable --now systemd-tmpfiles-setup.service
```

**Snap Store에서 설치한 Discord**의 소켓은 보통 `$XDG_RUNTIME_DIR/snap.discord/`에 있습니다. 같은 방식으로 링크를 만드세요.

```bash
ln -sf "$XDG_RUNTIME_DIR/snap.discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

링크를 만들기 전에 Discord를 실행하고, 완료 후 Nowly 사이드 패널에서 **연결 확인**을 누르세요.

## Flatpak 또는 Snap으로 설치한 브라우저

브라우저는 네이티브 메시징으로 Nowly 데스크톱 앱을 시작합니다. 샌드박스 브라우저는 시작할 수 있는 프로그램을 제한하며, 패키지와 버전에 따라 네이티브 메시징을 완전히 차단할 수도 있습니다. 무엇을 설치해도 **Nowly Desktop 감지됨** 항목이 초록색으로 바뀌지 않는 증상이 나타납니다.

가장 확실한 해결책은 Flatpak·Snap 버전 대신 배포판 저장소나 제조사의 `.deb`·`.rpm` 패키지로 설치한 브라우저를 사용하는 것입니다. 브라우저 계정에 로그인하면 북마크와 비밀번호를 다시 가져올 수 있습니다.

## 알림과 로그

권한 문제로 Discord가 연결을 차단할 때 데스크톱에 알림 서비스가 실행 중이라면 데스크톱 앱이 `notify-send`로 알림을 표시할 수 있습니다.

데스크톱 앱은 로그를 `~/.cache/NowlyClient/nowly-host.log`에 기록합니다. Discord로 보낸 활동이 포함될 수 있으므로 지원 요청에 공유하기 전에 내용을 읽어 보세요. 언제든 삭제할 수 있습니다.

## 체크리스트

- `dpkg -L nowly-host`에 앱이 표시되거나 압축 파일의 설치 스크립트가 오류 없이 실행됐습니다.
- 이전 설치에서 남은 매니페스트가 없습니다.
- Discord가 실행 중이고 `$XDG_RUNTIME_DIR` 또는 `/tmp`에서 소켓에 접근할 수 있습니다.
- 브라우저가 Flatpak·Snap 버전이 아니거나 그 브라우저에서 네이티브 메시징이 작동합니다.

네 가지를 모두 확인했는데도 Nowly가 Discord에 연결되지 않는다면 [문제 해결 체크리스트](/guides/rich-presence-not-showing)를 따라가 보세요. 해결되지 않으면 배포판, 데스크톱 환경, Discord와 브라우저의 설치 방법을 적어 Nowly Discord 서버에 문의하세요.
