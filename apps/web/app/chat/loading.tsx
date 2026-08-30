import { PageContainer, PageHeader, Card, CardBody, Spinner } from '../components/ui';

export default function ChatLoading() {
  return (
    <PageContainer>
      <PageHeader title="チャット" subtitle="ドキュメントの内容をもとに AI が回答します" />
      <Card>
        <CardBody>
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Spinner size={24} />
          </div>
        </CardBody>
      </Card>
    </PageContainer>
  );
}
