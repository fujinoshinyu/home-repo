export default function Home() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1>RAG System</h1>
      <p>自作 RAG システムの管理画面</p>
      <ul>
        <li><a href="/chat">Chat</a> — 質問応答</li>
        <li><a href="/documents">Documents</a> — ドキュメント管理</li>
      </ul>
    </main>
  );
}
