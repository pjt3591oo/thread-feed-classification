# Threads Manager

Threads 추천 피드의 게시글을 수집하고, JEV API를 통해 **정치 관련 여부**와 **AI 작성 징후**를 분석하는 크롬 확장 프로그램입니다.

확장 프로그램 팝업에서 수집한 게시글과 분석 결과를 확인하고, 분류별로 목록을 필터링할 수 있습니다.

> AI 작성 징후 분석은 참고용입니다. 본문만으로 실제 작성 주체를 확정할 수 없으며, ‘뚜렷한 근거 없음’이 사람이 작성했다는 의미는 아닙니다.

## 주요 기능

- Threads 웹페이지에 로드된 게시글 정보 수집
- 자동 스크롤을 통한 추가 게시글 수집
- 게시글 식별자(`shortcode`)를 기준으로 중복 처리
- JEV API를 이용한 정치 관련 여부 및 AI 작성 징후 분석
- `chrome.storage.local`에 게시글과 분석 결과 저장
- 팝업에서 분류별 목록 필터링 및 원문 열기
- 수집 시작·중지 및 JSON 내보내기

팝업의 필터는 표시할 목록을 변경합니다. **Threads 추천 피드의 게시글을 직접 숨기거나 추천 알고리즘을 변경하는 기능은 현재 포함하지 않습니다.**

## 기술 구성

- React · TypeScript
- Vite · CRXJS
- Chrome Extension Manifest V3
- JavaScript Content Script
- JEV `/v1/systemone` API

## 동작 방식

```text
Threads 추천 피드
    ↓
content.js
게시글 추출 및 스크롤
    ↓ POSTS_COLLECTED
background.ts
중복 확인 → JEV 분석 요청 → 결과 저장
    ↓
chrome.storage.local
    ↓
React 팝업
목록 조회 및 분류 필터링
```

공식 Threads API로 추천 피드를 조회하는 방식이 아니라, 로그인한 브라우저에 로드된 페이지에서 게시글 정보를 읽습니다.

## 시작하기

### 준비 사항

- Node.js 및 npm
- Google Chrome
- Threads 로그인 계정
- `/v1/systemone`을 제공하는 JEV 서버와 API 키

### 의존성 설치

프로젝트 폴더에서 실행합니다.

```bash
npm install
```

### 개발 모드 실행

```bash
npm run dev
```

1. Chrome에서 `chrome://extensions`를 엽니다.
2. **개발자 모드**를 켭니다.
3. **압축해제된 확장 프로그램을 로드합니다**를 선택합니다.
4. 프로젝트의 `dist` 폴더를 선택합니다.
5. Threads 페이지를 새로고침합니다.

개발 모드에서는 Vite 서버를 실행한 상태로 사용합니다. Manifest 변경 후에는 확장 프로그램과 Threads 탭을 모두 새로고침하세요.

### 배포용 빌드

```bash
npm run build
```

빌드가 완료되면 생성된 `dist` 폴더를 Chrome에 로드합니다.

## JEV 서버 설정

확장 프로그램 팝업에서 다음 항목을 입력하고 저장합니다.

| 항목 | 설명 | 예시 |
|---|---|---|
| JEV Host | 프로토콜을 포함한 서버 주소 | `http://127.0.0.1` |
| JEV Port | 서버 포트 | `8000` |
| JEV API Key | 서버 인증용 키 | 사용 중인 API 키 |

현재 요청 URL은 다음 형태로 구성됩니다.

```text
{JEV Host}:{JEV Port}/v1/systemone
```

Host에는 포트와 API 경로를 중복해서 입력하지 않습니다.

Manifest에는 로컬 저장소 사용을 위한 `storage` 권한과 분석 서버 주소에 맞는 `host_permissions`가 필요합니다. 로컬 서버를 사용하는 경우의 예시는 다음과 같습니다.

```json
{
  "permissions": ["storage"],
  "host_permissions": ["http://127.0.0.1/*"]
}
```

기존 Manifest의 다른 권한과 설정은 유지하고, 실제 사용하는 서버 주소에 맞춰 구성하세요.

## 사용 방법

1. 확장 프로그램 팝업에서 JEV 서버 설정을 저장합니다.
2. Threads 추천 피드를 엽니다.
3. 페이지에 표시되는 **수집 시작** 버튼을 누릅니다.
4. 확장 프로그램이 게시글을 수집하고 스크롤하며 추가 게시글을 확인합니다.
5. 팝업에서 분석된 게시글 목록을 확인합니다.
6. 정치 관련 및 AI 작성 징후 필터를 선택합니다.
7. 수집을 멈추려면 **중지** 버튼을 누릅니다.

두 필터는 AND 조건으로 적용됩니다. 예를 들어 ‘비정치’와 ‘AI 작성 의심’을 선택하면 두 조건을 모두 만족하는 게시글만 표시됩니다.

## 분석 결과

### 정치 관련 여부

| 값 | 의미 |
|---|---|
| `political` | 주된 내용이 정치 관련 |
| `nonPolitical` | 주된 내용이 정치와 관련 없음 |
| `uncertain` | 내용이나 문맥이 부족해 판단 어려움 |

정치인, 정당, 선거, 정치적 주장 및 정부 정책 논쟁 등을 문맥에 따라 분류합니다.

### AI 작성 징후

| 값 | 의미 |
|---|---|
| `suspectedAi` | AI 작성이 의심되는 징후가 있음 |
| `noClearEvidence` | AI 작성으로 의심할 뚜렷한 근거가 없음 |
| `uncertain` | 작성 주체를 평가할 근거가 부족함 |

글이 정돈되어 있거나 목록·이모지를 사용했다는 이유만으로 AI 작성이라고 판단하지 않도록 질문을 구성합니다. 분석 결과와 신뢰도는 실제 작성 주체에 대한 증거가 아닙니다.

## API 연동

분석 요청은 background 서비스 워커에서 전송합니다.

```http
POST /v1/systemone
Content-Type: application/json
Authorization: Bearer <API_KEY>
```

요청 본문의 기본 구조는 다음과 같습니다.

```json
{
  "model": "jev-1.13.0",
  "state": "{\"post_text\":\"분석할 게시글 본문\"}",
  "questions": {
    "politics": {
      "type": "choice",
      "instructions": "게시글의 정치 관련 여부를 판단하세요.",
      "criteria": {
        "political": "정치 관련",
        "nonPolitical": "비정치",
        "uncertain": "판단 불가"
      }
    },
    "aiAuthorship": {
      "type": "choice",
      "instructions": "작성 주체를 확정하지 말고 AI 작성 징후를 평가하세요.",
      "criteria": {
        "suspectedAi": "AI 작성 의심",
        "noClearEvidence": "뚜렷한 근거 없음",
        "uncertain": "판단 불가"
      }
    }
  }
}
```

애플리케이션은 응답의 다음 필드를 분석 결과로 사용합니다.

```text
answers.politics.choice
answers.aiAuthorship.choice
```

서버는 위 요청·응답 구조와 해당 모델을 지원해야 합니다.

## 데이터 및 개인정보

- 수집한 게시글과 분석 결과는 `chrome.storage.local`에 저장됩니다.
- 분석할 게시글 본문은 설정한 JEV 서버로 전송됩니다.
- API 키는 확장 프로그램 설정에 저장되며, 로컬 저장소는 비밀 관리 전용 저장소가 아닙니다.
- 실제 API 키, 인증 헤더, 수집 데이터 및 개인 설정은 Git 저장소에 커밋하지 마세요.
- JSON 내보내기는 content script가 보유한 수집 데이터를 기준으로 하며, background에 저장된 분석 결과가 포함되는지는 구현을 확인해야 합니다.

## 제한 사항

- PC Chrome의 Threads 웹페이지를 대상으로 합니다.
- Threads 모바일 앱에는 적용되지 않습니다.
- 페이지에 로드된 게시글만 수집하며, 전체 Threads 게시글을 수집하지 않습니다.
- Threads 화면 구조가 바뀌면 게시글 추출 코드를 수정해야 할 수 있습니다.
- `rawText`에는 본문 외에 작성자, 버튼 문구, 반응 수 등이 포함될 수 있습니다.
- 이미지 속 글자와 영상 내용은 현재 텍스트 분석 대상에 포함하지 않습니다.
- 동일한 `shortcode`를 중복으로 건너뛰는 경우, 수정된 본문은 자동 재분석되지 않을 수 있습니다.
- 중지 버튼은 추가 수집을 멈추며, 이미 전송되었거나 대기 중인 분석 요청의 취소를 보장하지 않습니다.
- 분석 정확도는 별도 검증이 필요합니다.

## 문제 해결

### `content.js`를 찾을 수 없는 경우

CRXJS가 사용하는 Manifest의 `content_scripts[].js`에 실제 소스 경로를 지정합니다.

```json
{
  "content_scripts": [
    {
      "matches": [
        "https://www.threads.com/*",
        "https://threads.com/*"
      ],
      "js": ["src/content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

### API가 `422`를 반환하는 경우

응답의 `detail`을 확인합니다. `state`, `questions` 등 필수 항목과 서버가 요구하는 타입이 맞는지 확인하세요. 동일한 요청을 반복하기보다 요청 형식을 먼저 수정합니다.

### 로그 확인 위치

| 실행 위치 | 확인 방법 |
|---|---|
| `content.js` | Threads 탭 → 개발자 도구 → Console |
| `background.ts` | `chrome://extensions` → 서비스 워커 검사 |
| React 팝업 | 팝업 우클릭 → 검사 → Console |

### 같은 게시글이 반복 전송되는 경우

content script에서 `shortcode`를 확인하고, 비동기 전송 전에 중복 확인용 목록에 등록해야 합니다. 페이지 새로고침이나 여러 탭에서는 별도 목록이 생성되므로 background에서도 중복 확인이 필요합니다.