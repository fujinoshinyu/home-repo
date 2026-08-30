import { PageContainer, PageHeader, Card, CardHeader, CardBody, Spinner, EmptyState } from '../components/ui';

export default function DocumentsLoading() {
  return (
    <PageContainer>
      <PageHeader title="ドキュメント管理" subtitle="ファイルをアップロードして AI に学習させます" />
      <Card style={{ marginBottom: 24 }}>
        <CardHeader>ファイル登録</CardHeader>
        <CardBody>
          <div className="upload-area" style={{ opacity: 0.5 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>読み込み中...</span>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>登録済みドキュメント</CardHeader>
        <EmptyState description="読み込み中...">
          <Spinner size={24} />
        </EmptyState>
      </Card>
    </PageContainer>
  );
}
