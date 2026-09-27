(() => {
  const posts = new Map();
  let running = false;

  const POST_SELECTOR = 'a[href*="/post/"]';

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 게시글 링크에서 작성자와 게시글 식별자를 추출
  function parsePostLink(link) {
    const url = new URL(link.href, location.origin);
    if (url.origin !== location.origin) return null;

    const match = url.pathname.match(/^\/@([^/]+)\/post\/([^/]+)/);
    if (!match) return null;

    return {
      username: decodeURIComponent(match[1]),
      shortcode: match[2],
      permalink: `${url.origin}/@${match[1]}/post/${match[2]}`,
    };
  }

  // 임시 추정 방식: 같은 게시글 링크만 포함하는 상위 영역 탐색.
  // 실제 Threads DOM에 맞춰 이 함수를 교체하는 것이 좋습니다.
  function findPostContainer(link, shortcode) {
    let candidate = null;

    for (
      let node = link.parentElement;
      node && node !== document.body;
      node = node.parentElement
    ) {
      const ids = new Set(
        [...node.querySelectorAll('a[href*="/post/"]')]
          .map(parsePostLink)
          .filter(Boolean)
          .map((post) => post.shortcode),
      );

      if (ids.size !== 1 || !ids.has(shortcode)) break;

      if (node.innerText.trim()) {
        candidate = node;
      }
    }

    return candidate;
  }

  // 링크 하나에서 게시글 추출 및 전송
  function collectPost(link) {
    const info = parsePostLink(link);
    if (!info || posts.has(info.shortcode)) return false;

    const container = findPostContainer(link, info.shortcode);
    if (!container) return false;

    const post = {
      ...info,
      rawText: container.innerText.trim(),
      timestamp:
        container.querySelector("time")?.getAttribute("datetime") ?? null,
      collectedAt: new Date().toISOString(),
    };

    // 응답 대기 중 중복 전송 방지
    posts.set(info.shortcode, post);

    chrome.runtime
      .sendMessage({
        action: "POSTS_COLLECTED",
        post,
      })
      .then((response) => {
        if (!response?.ok) {
          throw new Error(response?.error ?? "background 처리 실패");
        }
      })
      .catch((error) => {
        console.error("게시글 전송 실패:", info.shortcode, error);
      });

    return true;
  }

  // 마지막으로 처리한 위치 이후의 링크만 순회
  function collectPage() {
    const startedAt = performance.now();
    const links = document.querySelectorAll(POST_SELECTOR);

    const stats = {
      links: links.length,
      invalid: 0,
      duplicate: 0,
      noContainer: 0,
      added: 0,
    };

    for (const link of links) {
      const info = parsePostLink(link);

      if (!info) {
        stats.invalid++;
        continue;
      }

      if (posts.has(info.shortcode)) {
        stats.duplicate++;
        continue;
      }

      // collectPost 내부에서 컨테이너를 찾고 전송
      if (collectPost(link)) {
        stats.added++;
      } else {
        stats.noContainer++;
      }
    }

    console.log("[수집 진단]", {
      ...stats,
      total: posts.size,
      elapsedMs: Math.round(performance.now() - startedAt),
    });

    updateStatus();
    return stats.added;
  }

  // 페이지 전체 또는 내부 스크롤 영역을 찾음
  function findScroller() {
    const link = document.querySelector('a[href*="/post/"]');

    for (
      let node = link?.parentElement;
      node && node !== document.body;
      node = node.parentElement
    ) {
      const { overflowY } = getComputedStyle(node);

      if (
        /(auto|scroll)/.test(overflowY) &&
        node.scrollHeight > node.clientHeight
      ) {
        return node;
      }
    }

    return document.scrollingElement;
  }

  async function start() {
    if (running) return;
    running = true;
    startButton.disabled = true;

    let emptyRounds = 0;
    const initialUrl = location.href;

    try {
      const saved = await chrome.storage.local.get([
        "jevHost",
        "jevPort",
        "jevApiKey",
      ]);
      if (!saved.jevHost || !saved.jevPort) {
        alert("JEV settings are not set. Please set them first.");
        return;
      }
      collectPage();

      // 최대 30번 스크롤
      while (running) {
        if (location.href !== initialUrl) break;

        const scroller = findScroller();
        if (!scroller) break;

        scroller.scrollBy({
          top: Math.max(300, scroller.clientHeight * 0.8),
          behavior: "instant",
        });

        // 로딩 중에도 여러 차례 수집
        let added = 0;

        // 로딩 중 6번 수집 시도, 500ms 간격
        for (let tick = 0; tick < 6 && running; tick++) {
          await sleep(500);

          if (!running || location.href !== initialUrl) break;

          added += collectPage();

          // 새 글을 수집했으면 다음 스크롤로 진행
          if (added > 0) break;
        }

        emptyRounds = added === 0 ? emptyRounds + 1 : 0;

        // 신규 글이 계속 없으면 종료
        if (emptyRounds >= 5) break;
      }
    } catch (error) {
      console.error("[Threads Reader]", error);
    } finally {
      running = false;
      startButton.disabled = false;
      updateStatus();
    }
  }

  function download() {
    collectPosts();

    const blob = new Blob([JSON.stringify([...posts.values()], null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "threads-posts.json";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // 사이트 스타일과 충돌하지 않는 조작 패널
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;right:20px;bottom:20px;z-index:2147483647";

  const panel = host.attachShadow({ mode: "open" });
  panel.innerHTML = `
    <style>
      div {
        background: #222; color: white; padding: 14px;
        border-radius: 10px; font: 14px sans-serif;
      }
      button { margin: 8px 4px 0 0; cursor: pointer; }
    </style>
    <div>
      <span id="status"></span><br>
      <button id="start">수집 시작</button>
      <button id="stop">중지</button>
      <button id="save">JSON 저장</button>
    </div>
  `;

  document.body.appendChild(host);

  const startButton = panel.querySelector("#start");

  function updateStatus() {
    panel.querySelector("#status").textContent =
      `${running ? "수집 중" : "대기"} · ${posts.size}개`;
  }

  startButton.addEventListener("click", start);

  panel.querySelector("#stop").addEventListener("click", async () => {
    running = false;
    updateStatus();
    await chrome.runtime.sendMessage({ action: "STOP_COLLECTING" });
  });

  panel.querySelector("#save").addEventListener("click", download);
  updateStatus();
})();
