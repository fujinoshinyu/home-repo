'use client';

import { useState } from 'react';
import { streamRag } from '@/features/chat/endpoints/chat-api';

export default function ChatPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<Array<{ id: string; source: string; score: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setAnswer('');
    setSources([]);

    try {
      const stream = await streamRag(question);
      for await (const chunk of stream) {
        if (chunk.type === 'token' && chunk.token) {
          setAnswer((prev) => prev + chunk.token);
        } else if (chunk.type === 'sources' && chunk.sources) {
          setSources(chunk.sources);
        }
      }
    } catch (err) {
      setAnswer(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1>RAG Chat</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="質問を入力してください..."
          rows={3}
          style={{ width: '100%', padding: 12, fontSize: 16 }}
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          style={{ marginTop: 8, padding: '8px 24px', fontSize: 16 }}
        >
          {isLoading ? '回答中...' : '送信'}
        </button>
      </form>

      {answer && (
        <section style={{ marginBottom: 24 }}>
          <h2>回答</h2>
          <div style={{ whiteSpace: 'pre-wrap', padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            {answer}
          </div>
        </section>
      )}

      {sources.length > 0 && (
        <section>
          <h2>参照元</h2>
          <ul>
            {sources.map((s) => (
              <li key={s.id}>
                {s.source} (score: {s.score.toFixed(4)})
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
