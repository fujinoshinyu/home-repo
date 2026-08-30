'use client';

import { Card, CardBody, EmptyState, Button } from './components/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-container">
      <Card>
        <CardBody>
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            }
            title="エラーが発生しました"
            description={error.message}
          >
            <div style={{ marginTop: 20 }}>
              <Button onClick={() => reset()}>再試行</Button>
            </div>
          </EmptyState>
        </CardBody>
      </Card>
    </div>
  );
}
