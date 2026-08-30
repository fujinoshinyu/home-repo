import Link from 'next/link';

export default function Home() {
  return (
    <div className="page-container">
      <div className="hero">
        <div className="hero-title">RAG System</div>
        <div className="hero-desc">
          ドキュメントを登録して、AI に質問できる自作 RAG システムの管理画面です。
        </div>
      </div>

      <div className="feature-grid">
        <Link href="/chat" className="feature-card">
          <div
            className="feature-card-icon"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            <ChatIcon />
          </div>
          <div className="feature-card-title">チャット</div>
          <div className="feature-card-desc">
            登録済みドキュメントをもとに、AI が質問に回答します。ストリーミングでリアルタイムに結果を表示します。
          </div>
        </Link>

        <Link href="/documents" className="feature-card">
          <div
            className="feature-card-icon"
            style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}
          >
            <DocIcon />
          </div>
          <div className="feature-card-title">ドキュメント管理</div>
          <div className="feature-card-desc">
            テキスト・PDF・画像ファイルをアップロードして、ベクトル化・インデックス登録を行います。
          </div>
        </Link>
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
