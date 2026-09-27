/* eslint-disable @typescript-eslint/no-explicit-any */

// 기본적인 Chrome API 타입 확장
declare namespace chrome {
  namespace runtime {
    interface Port {
      name: string
      onMessage: chrome.events.Event<(message: any) => void>
      postMessage: (message: any) => void
    }
  }
}

// 메시지 타입 정의
interface ChromeMessage {
  action: string
  data?: any
}