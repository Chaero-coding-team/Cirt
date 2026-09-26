# OGS Plus

OGS(Online-Go.com)를 더 편리하게 사용할 수 있게 해주는 Chrome 확장 프로그램입니다.
크롬 웹스토어에는 등록하지 않고, `chrome://extensions` 개발자 모드에서 **압축해제된 확장 프로그램 로드**로 수동 설치하는 방식입니다.

## 설치 방법

1. `chrome://extensions` 접속
2. 우측 상단 "개발자 모드" 켜기
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. 이 저장소의 `src/` 폴더를 선택

## 사용 방법

설치 후 **online-go.com에 접속 → 우측 상단 프로필 클릭 → Settings** 로 들어가면,
기존 설정 목록(General, Sound, Game, ... ) 맨 아래에 **"Plus Settings"** 탭이 새로 생깁니다.
모든 기능은 이 탭에서 켜고 끌 수 있습니다 (`/settings/plus`).

## 주요 기능

| 기능 | 설명 |
|---|---|
| 🌐 다국어 | 확장 프로그램 UI를 영어 포함 9개 언어(한국어/일본어/중국어/스페인어/프랑스어/독일어/러시아어/포르투갈어)로 전환 |
| 🎙️ 해설 음성 입력 | 시연 바둑판(Demo Board)에서 수를 둔 뒤 **Ctrl+Alt**를 누르고 있으면 선택한 언어로 음성 인식되어 채팅 입력창에 채워짐. 실제 전송은 **Enter**를 눌러야 기록됨 |
| 🖼️ 이미지 링크 미리보기 | 대국 채팅 / DM에 올라온 이미지 링크(스팸·해킹 위험)를 직접 클릭하지 않도록 안전한 인라인 미리보기 표시 |
| 🎨 커스텀 스타일시트 | About에 `<link>` 태그를 수동으로 넣을 필요 없이, CSS를 작성 → 베타 미리보기 → 수락하면 자동으로 About에 `<style>` 블록이 삽입됨 |
| 🔠 About 헤딩 단축키 | About 편집 중 **Alt+H → 1~5** 를 누르면 해당 레벨의 Markdown 헤딩(H1~H5)이 커서 위치에 자동 삽입 |
| ⚡ Beta 링크 | 상단 네비게이션 바에 'Beta' 버튼을 추가, 클릭 시 현재 페이지의 beta.online-go.com 버전으로 이동 |
| 📊 프로필 승률 위젯 | 사용자 프로필 페이지에서 전체 대국 기록을 집계해 승률 카드로 표시 |
| 🎮 SGF 대국 업로드 | SGF 라이브러리 페이지에 'OGS Game' 버튼 추가 → 내 대국/다른 사람 대국을 선택해 SGF를 바로 업로드 |
| 🤖 봇 랭크전 신청 헬퍼 | 많은 AI 봇이 랭크전을 자동 수락하지 않으므로, 봇 프로필에서 수동으로 랭크전을 신청하도록 안내/바로가기 제공 |
| 🔔 통합 알림 + 조용 모드 | 공지사항/포럼 답글/DM 발생 시 데스크탑 알림. DM이 너무 많을 때는 조용 모드로 DM 알림만 차단 |
| 🎛️ 전체 온/오프 | 위 모든 기능은 각각 자유롭게 켜고 끌 수 있으며, 마스터 스위치로 전체를 한 번에 끌 수도 있음 |

## 프로젝트 구조

```
src/
├── manifest.json              # Manifest V3 정의
├── background/background.js   # 알림 처리용 service worker
├── content/                   # OGS 페이지에 주입되는 content scripts
│   ├── utils.js                 공통 DOM/설정/번역 헬퍼
│   ├── notice.js                토스트 알림 UI
│   ├── settings-tab.js          "Plus Settings" 탭 주입 (핵심 UI)
│   ├── voice-commentary.js      Ctrl+Alt 음성 해설 → 채팅 입력
│   ├── image-preview.js         채팅/DM 이미지 링크 미리보기
│   ├── custom-css.js            커스텀 CSS 베타 미리보기 & About 자동 게시
│   ├── about-heading.js         Alt+H+1~5 헤딩 단축키
│   ├── beta-link.js             상단바 Beta 링크
│   ├── profile-stats.js         프로필 승률 위젯
│   ├── sgf-upload.js            SGF 'OGS Game' 업로드 모달
│   ├── bot-rank-request.js      봇 랭크전 신청 헬퍼
│   ├── notifications-watcher.js 공지/포럼/DM 감지 → 알림
│   └── main.js                  오케스트레이터(설정 로드/구독)
├── lib/
│   ├── browser-polyfill.js    chrome.storage Promise 래퍼
│   └── storage.js             설정 스키마 + 기본값 + 저장/구독
├── i18n/translations.js       9개국어 번역 딕셔너리
├── popup/                     툴바 팝업 (Plus Settings로 바로가기)
├── options/                   확장 프로그램 옵션 페이지(안내용)
└── icons/                     확장 프로그램 아이콘
```

## 구현 근거

이 확장 프로그램은 OGS의 오픈소스 프론트엔드([online-go/online-go.com](https://github.com/online-go/online-go.com))
소스코드를 실제로 조사하여, 존재하는 DOM 클래스명·API 엔드포인트를 기반으로 셀렉터와 API 호출을 구성했습니다.
(예: `.Settings`/`#SettingsGroupSelector`, `.chat-line`/`.ChatLine`, `textarea.about-editor`,
`players/{id}/game_history/`, `games/{id}/sgf`, `me/games/sgf/{collection_id}`, `beta.online-go.com` 등)

## 주의사항

- SPA(단일 페이지 앱) 라우팅에 대응하기 위해 MutationObserver와 `history.pushState` 후킹을 사용합니다.
- 커스텀 CSS "수락" 기능은 실제로 사용자의 About 프로필 텍스트를 수정하는 API(`PUT players/{id}`)를 호출합니다. 되돌리려면 Plus Settings에서 다시 끄거나 About을 직접 편집하세요.
- 음성 인식은 브라우저 내장 Web Speech API를 사용하며, 별도 서버로 음성 데이터를 전송하지 않습니다(브라우저의 STT 구현에 따름).
