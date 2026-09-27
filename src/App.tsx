import { useEffect, useState } from 'react'
import './App.css'

type Post = {
  shortcode: string;
  text?: string;
  rawText?: string;
  permalink: string;
  username: string;
  politics: "political" | "nonPolitical" | "uncertain";
  aiAuthorship: "suspectedAi" | "noClearEvidence" | "uncertain";
};

type LocalStorageData = {
  posts?: Post[];
  jevHost?: string;
  jevPort?: string;
  jevApiKey?: string;
};

function App() {
  const [jevHost, setJevHost] = useState<string>('');
  const [jevPort, setJevPort] = useState<string>('');
  const [jevApiKey, setJevApiKey] = useState<string>('');

  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const saved = await chrome.storage.local.get<LocalStorageData>(["posts"])
      setPosts(saved.posts ?? []);
    }

    const initJevSettings = async () => {
      const saved = await chrome.storage.local.get<LocalStorageData>(["jevHost", "jevPort", "jevApiKey"]);
      setJevHost(saved.jevHost ?? '');
      setJevPort(saved.jevPort ?? '');
      setJevApiKey(saved.jevApiKey ?? '');
    }

    setInterval(() => {
      fetchPosts();
    }, 300);

    initJevSettings();
  }, [])

  const onClearPostsHandler = async () => {
    await chrome.runtime.sendMessage({
      action: "CLEAR_POSTS",
    });
  }

  const onClickJevSettingsSave = async (host: string, port: string, apiKey: string) => {
    await chrome.runtime.sendMessage({
        action: "JEV_SETTINGS_SAVE",
        host,
        port,
        apiKey
      });

      setJevHost(host);
      setJevPort(port);
      setJevApiKey(apiKey);
  };

return (
  <main className="threads-app">
    <aside className="settings-card">
      <header className="section-header">
        <span className="eyebrow">CONNECTION</span>
        <h1>JEV 설정</h1>
        <p>게시글을 분석할 서버를 연결하세요.</p>
      </header>

      <div className="settings-fields">
        <label className="field" htmlFor="jevHost">
          <span>서버 주소</span>
          <input
            id="jevHost"
            type="text"
            placeholder="http://127.0.0.1"
            value={jevHost}
            onChange={(e) => setJevHost(e.target.value)}
          />
        </label>

        <label className="field" htmlFor="jevPort">
          <span>포트</span>
          <input
            id="jevPort"
            type="text"
            inputMode="numeric"
            placeholder="8000"
            value={jevPort}
            onChange={(e) => setJevPort(e.target.value)}
          />
        </label>

        <label className="field" htmlFor="jevApiKey">
          <span>API 키</span>
          <input
            id="jevApiKey"
            type="password"
            placeholder="API 키를 입력하세요"
            value={jevApiKey}
            onChange={(e) => setJevApiKey(e.target.value)}
          />
        </label>
      </div>

      <div className="settings-actions">
        <button
          className="button button-primary"
          onClick={() =>
            void onClickJevSettingsSave(jevHost, jevPort, jevApiKey)
          }
        >
          설정 저장
        </button>

        <button
          className="button button-secondary"
          onClick={() => void onClickJevSettingsSave("", "", "")}
        >
          설정 초기화
        </button>
      </div>
    </aside>

    <section className="posts-panel">
      <header className="posts-header">
        <div className="section-header">
          <span className="eyebrow">THREADS MANAGER</span>
          <h1>게시글 분석</h1>
          <p>수집한 글과 분석 결과를 한눈에 확인하세요.</p>
        </div>

        <button
          className="button button-danger"
          onClick={onClearPostsHandler}
        >
          목록 초기화
        </button>
      </header>

      <div className="list-summary">
        <h2>수집된 게시글</h2>
        <span className="count-badge">{posts.length}</span>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">≡</span>
          <h3>아직 수집된 글이 없어요</h3>
          <p>Threads에서 수집을 시작하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.shortcode} className="post-card">
              <div className="post-author">
                <span className="avatar" aria-hidden="true">
                  {(post.username || "?").slice(0, 1).toUpperCase()}
                </span>
                <h3>@{post.username || "알 수 없는 사용자"}</h3>
              </div>

              <p className="post-text">
                {post.text || post.rawText || "내용 없음"}
              </p>

              <footer className="post-footer">
                <div className="post-badges">
                  <span className={`badge politics-${post.politics}`}>
                    {post.politics === "political"
                      ? "정치 관련"
                      : post.politics === "nonPolitical"
                        ? "비정치"
                        : post.politics === "uncertain"
                          ? "정치 여부 불확실"
                          : "분석 대기"}
                  </span>

                  <span className={`badge ai-${post.aiAuthorship}`}>
                    {post.aiAuthorship === "suspectedAi"
                      ? "AI 작성 의심"
                      : post.aiAuthorship === "noClearEvidence"
                        ? "AI 징후 뚜렷하지 않음"
                        : post.aiAuthorship === "uncertain"
                          ? "AI 여부 불확실"
                          : "분석 대기"}
                  </span>
                </div>

                <a
                  className="post-link"
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${post.username || "사용자"}의 원문 보기 (새 탭)`}
                >
                  원문 보기 ↗
                </a>
              </footer>
            </li>
          ))}
        </ul>
      )}

      <p className="analysis-note">
        AI 작성 징후는 참고용이며, 실제 작성 주체를 확정하지 않습니다.
      </p>
    </section>
  </main>
);
}

export default App