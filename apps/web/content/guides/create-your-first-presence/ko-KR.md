---
title: 첫 Nowly 프레즌스 만들기
description: 빈 폴더에서 Discord 활동을 표시하는 프레즌스까지, 필요한 도구와 파일, 첫 스크립트, 로컬 테스트, 게시 방법을 안내합니다.
category: developers
order: 1
updated: 2026-10-09
related: what-is-discord-rich-presence, allow-user-scripts, nowly-vs-premid
---

Nowly 라이브러리의 모든 플랫폼에는 누군가 작성한 프레즌스가 있습니다. 사용하는 웹사이트가 목록에 없다면 직접 추가할 수 있습니다. 프레즌스는 작은 TypeScript 프로젝트이며, 처음 만드는 버전은 보통 100줄도 안 됩니다. Nowly CLI가 기본 구조 생성, 빌드, 로컬 테스트를 처리합니다. 이 가이드는 아무것도 없는 상태에서 시작해 Discord 상태를 업데이트하는 프레즌스를 만드는 과정을 안내합니다. 전체 API 설명은 [Nowly 문서](https://docs.nowly.me/)에서 볼 수 있습니다.

## 필요한 도구

- CLI 실행과 프레즌스 빌드를 위한 **Node.js 22 이상**과 **pnpm**.
- 프레즌스 저장소를 복제하고 풀 리퀘스트를 올리기 위한 **Git**.
- 실제 환경에서 시험할 **Chromium 브라우저 또는 Firefox**, **Discord 데스크톱 앱**, 설치된 [Nowly 데스크톱 앱](/desktop).
- 기본적인 JavaScript 또는 TypeScript 지식과 대상 페이지를 살펴볼 브라우저 개발자 도구.

## 저장소와 CLI 준비하기

모든 커뮤니티 프레즌스는 MIT 라이선스로 공개된 하나의 저장소에 모여 있습니다.

```bash
git clone https://github.com/nowly-presence/presences.git
cd presences
pnpm install
pnpm i -g @nowly/cli
```

`pnpm install`은 편집기에서 Presence API의 타입 정보를 제공하는 `@nowly/sdk` 패키지도 연결합니다.

## 프레즌스 기본 구조 만들기

```bash
nowly init "Example"
```

CLI에서 몇 가지 질문에 답하면 플랫폼 이름의 첫 글자를 기준으로 `src/E/Example/` 아래에 폴더를 만듭니다.

- `metadata.json`: 프레즌스의 이름, 작성자, 지원 주소, 분류, 색상, 설명과 설정을 담습니다.
- `presence.ts`: 페이지를 읽고 활동을 설정하는 코드입니다.
- `locales/`: Discord에 표시되는 언어별 문구가 들어 있습니다.
- `assets/`: Discord와 라이브러리에 쓰는 로고, 아이콘, 썸네일입니다.

Discord가 이 플랫폼을 계정 연결로 이미 표시하는지도 CLI에서 묻습니다. 그렇다면 라이브러리에서 사용자에게 알려줄 수 있도록 프레즌스에 표시합니다.

## metadata.json에 플랫폼 설명하기

가장 중요한 항목은 주소입니다. `url`에는 호스트 이름을 적고 `regExp`에는 프레즌스를 실행할 페이지 주소의 패턴을 적습니다. 사이트가 허용하는 한 범위를 좁게 지정하세요. 프레즌스가 이해하지 못하는 페이지에서 실행되면 안 됩니다.

`category`는 `streaming`, `music`, `video`, `social`, `gaming`, `tools`, `ai`, `learning`, `creator`, `other` 중 하나입니다. 설명은 언어별로 작성하며 영어를 기본 대체 언어로 사용합니다.

## 첫 프레즌스 코드 작성하기

`Presence`와 `Assets`는 런타임에서 제공합니다. SDK에서는 `PresenceType` 같은 도우미만 가져옵니다.

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

`UpdateData`는 페이지가 열려 있는 동안 정기적으로, 그리고 사용자가 설정을 바꿀 때마다 실행됩니다. 그때마다 페이지를 읽고 활동을 보내세요. 표시할 만한 내용이 없다면 빈 상태를 보내는 대신 `presence.clearActivity()`를 호출하세요.

미디어의 경우 SDK의 `createMediaTimestamps(video)`를 사용하면 `audio` 또는 `video` 요소를 Discord 진행 표시줄에 필요한 시작·종료 시각으로 변환할 수 있습니다.

## 사용자를 배려하기

라이브러리의 프레즌스는 사용자가 믿고 쓰는 몇 가지 원칙을 따릅니다.

- 사용자가 실제로 하는 일을 보여주되 둘러보는 페이지를 전부 표시하지는 마세요. 둘러보기 페이지는 기본적으로 꺼진 **둘러보기 활동 표시** 설정을 켜야 보이게 하세요.
- 개인적인 콘텐츠에는 제목을 숨기거나 비공개 대화가 Discord에 나오지 않게 하는 등 개인정보 보호 옵션을 제공하세요.
- 활동 표시 외의 다른 곳으로 데이터를 보내지 말고 필요한 범위를 넘어 정보를 읽지 마세요.
- Discord에 표시되는 모든 문구에 `locales/`의 현지화된 문자열을 사용하세요.

## 로컬에서 빌드하고 테스트하기

메타데이터와 이미지 파일을 검증한 다음 빌드하세요.

```bash
nowly validate
nowly build example
```

브라우저에 Nowly를 아직 설치하지 않았다면 프레즌스가 포함된 개발용 확장 프로그램을 만드세요.

```bash
nowly extension example
nowly extension example --firefox
```

Chrome에서는 **개발자 모드**를 켜고 `chrome://extensions`에서 `dist/extension-dev`를 압축 해제된 확장 프로그램으로 불러오세요. Firefox에서는 `about:debugging`에서 `dist/extension-dev-firefox/manifest.json`을 임시 부가 기능으로 불러오세요. 대상 웹사이트를 열면 Discord 상태가 바뀌어야 합니다.

이미 압축 해제된 Nowly 개발용 빌드를 실행 중이라면 zip 파일로 더 빠르게 반복할 수 있습니다.

```bash
nowly pack example
```

그런 다음 확장 프로그램의 **설정**, **고급**, **디버그**에서 `dist/packs/example.zip`을 넣으세요. 서명되지 않은 zip은 압축 해제된 빌드에서만 허용되며 스토어 버전에서는 절대 허용되지 않습니다.

## 게시하기

1. `nowly validate`를 마지막으로 실행하고 재생 중인 콘텐츠가 없을 때를 포함해 실제 페이지 몇 곳에서 프레즌스를 확인하세요.
2. Discord 상태 스크린샷과 간단한 설명을 첨부해 프레즌스 저장소에 풀 리퀘스트를 여세요.
3. 팀이 코드를 검토하고 릴리스에 서명해 라이브러리에 게시합니다. 그러면 누구나 클릭 한 번으로 설치할 수 있고 라이브러리 페이지에 작성자 이름도 표시됩니다.

## 더 알아보기

문서에서 전체 Presence API, 설정, 현지화, 타임스탬프, iframe, Discord에서 직접 불러올 수 없는 이미지를 위한 이미지 프록시를 설명합니다. [첫 프레즌스 만들기](https://docs.nowly.me/presence-development/creating-your-first-presence)부터 읽고, 풀 리퀘스트를 열기 전에 [기여 가이드라인](https://docs.nowly.me/publishing/contribution-guidelines)을 참고하세요.
