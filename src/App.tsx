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

function App() {
  const [jevHost, setJevHost] = useState<string>('');
  const [jevPort, setJevPort] = useState<string>('');
  const [jevApiKey, setJevApiKey] = useState<string>('');

  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const saved = await chrome.storage.local.get(["posts"])
      setPosts(saved.posts ?? []);
    }

    const initJevSettings = async () => {
      const saved = await chrome.storage.local.get(["jevHost", "jevPort", "jevApiKey"]);
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
    const response = await chrome.runtime.sendMessage({
        action: "JEV_SETTINGS_SAVE",
        host,
        port,
        apiKey
      });
  };

  return (
    <div className="App" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', height: '900px' }}>
      
      <div className="jev-settings" style={{ width: '200px', padding: '20px' }}>
        <h1 style={{ fontSize: '18px', marginBottom: '20px' }}>JEV 설정</h1>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="jevHost">JEV Host:</label>
          <input
            type="text"
            id="jevHost"
            value={jevHost}
            onChange={(e) => setJevHost(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="jevPort">JEV Port:</label>
          <input
            type="text"
            id="jevPort"
            value={jevPort}
            onChange={(e) => setJevPort(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="jevApiKey">JEV API Key:</label>
          <input
            type="text"
            id="jevApiKey"
            value={jevApiKey}
            onChange={(e) => setJevApiKey(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <button
            onClick={() => {
              onClickJevSettingsSave(jevHost, jevPort, jevApiKey);
            }}
            style={{ width: '100%' }}
          >
            저장
          </button>
        </div>

                <div>
          <button
            onClick={() => {
              onClickJevSettingsSave('', '', '');
            }}
            style={{ width: '100%' }}
          >
            초기화
          </button>
        </div>
      </div>

      <div style={{ width: '400px', padding: '20px' }}>
        <div>
          <h1 style={{ fontSize: '18px', marginBottom: '20px' }}>쓰레드 게시글 필터</h1>
          <button className="btn btn-primary" onClick={onClearPostsHandler}>
            초기화
          </button>
        </div>
        
        
        <div style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>수집된 게시글{posts.length}</h2>
          {posts.length === 0 ? (
            <p>게시글이 없습니다.</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {posts.map((post) => (
                <li key={post.shortcode} style={{ marginBottom: '10px', textAlign: 'left', padding: 0 }}>
                  <h3 >{post.username} / {post.politics} / {post.aiAuthorship}</h3>
                  <a className="single-line" href={post.permalink} target="_blank" rel="noopener noreferrer">
                    {post.text || post.rawText || '내용 없음'}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
   
  )
}

export default App