export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: 'sans-serif' }}>
        <nav style={{ padding: '12px 24px', borderBottom: '1px solid #ddd', display: 'flex', gap: 16 }}>
          <a href="/">Home</a>
          <a href="/chat">Chat</a>
          <a href="/documents">Documents</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
