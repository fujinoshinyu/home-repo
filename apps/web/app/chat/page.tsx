'use client';

import { useState } from 'react';
import { streamRag } from '@/features/chat/endpoints/chat-api';
import { PageContainer, PageHeader, Card, CardHeader, CardBody, Button, EmptyState } from '../components/ui';

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
    <PageContainer>
      <PageHeader title="チャット" subtitle="ドキュメントの内容をもとに AI が回答します" />

      <Card style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <CardBody>
            <textarea
              className="textarea"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="質問を入力してください..."
              rows={3}
              style={{ marginBottom: 12 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" loading={isLoading} disabled={!question.trim()}>
                {isLoading ? '回答中...' : '送信'}
              </Button>
            </div>
          </CardBody>
        </form>
      </Card>

      {answer && (
        <Card style={{ marginBottom: 24 }}>
          <CardHeader>回答</CardHeader>
          <CardBody>
            <div className="chat-answer">{answer}</div>
          </CardBody>
        </Card>
      )}

      {sources.length > 0 && (
        <Card>
          <CardHeader>参照元 ({sources.length}件)</CardHeader>
          <CardBody>
            <ul className="source-list">
              {sources.map((s) => (
                <li key={s.id} className="source-item">
                  <span className="source-name">{s.source}</span>
                  <span className="source-score">{s.score.toFixed(4)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {!answer && !isLoading && (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
          title="質問を入力して送信してください"
          description="登録済みドキュメントから関連情報を検索して回答します"
        />
      )}
    </PageContainer>
  );
}
