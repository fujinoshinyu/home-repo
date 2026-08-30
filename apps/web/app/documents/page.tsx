'use client';

import { useState, useEffect, useRef } from 'react';
import {
  listDocuments,
  deleteDocument,
  type DocumentResponse,
} from '@/features/documents/endpoints/document-api';
import { uploadDocument } from '@/features/documents/endpoints/document-upload-api';
import {
  PageContainer,
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  EmptyState,
  ProgressBar,
  Alert,
  Spinner,
} from '../components/ui';
import { useToast } from '../components/ui/toast';

export default function DocumentsPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchDocuments() {
    try {
      const data = await listDocuments();
      setDocuments(data.documents);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(null);
    try {
      await uploadDocument(selectedFile, {
        onProgress: (completed, total) => {
          setUploadProgress({ completed, total });
        },
      });
      await fetchDocuments();
      toast(`${selectedFile.name} を登録しました`, 'success');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'アップロードに失敗しました';
      toast(msg, 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('このドキュメントを削除しますか？')) return;
    try {
      await deleteDocument(id);
      await fetchDocuments();
      toast('ドキュメントを削除しました', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '削除に失敗しました';
      toast(msg, 'error');
    }
  }

  return (
    <PageContainer>
      <PageHeader title="ドキュメント管理" subtitle="ファイルをアップロードして AI に学習させます" />

      <Card style={{ marginBottom: 24 }}>
        <CardHeader>ファイル登録</CardHeader>
        <CardBody>
          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={isUploading}
              accept=".md,.txt,.pdf,.json,.png,.jpg,.jpeg,.webp"
            />
            <Button
              variant="primary"
              size="sm"
              loading={isUploading}
              disabled={!selectedFile}
              onClick={handleUpload}
            >
              {isUploading ? '登録中...' : '登録'}
            </Button>
          </div>

          {selectedFile && !isUploading && (
            <Alert style={{ marginTop: 12 }}>
              <span>選択中: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </Alert>
          )}

          {uploadProgress && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <span>embedding 処理中...</span>
                <span>{uploadProgress.completed} / {uploadProgress.total} チャンク</span>
              </div>
              <ProgressBar value={uploadProgress.completed} max={uploadProgress.total} />
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <span>登録済みドキュメント</span>
          {!isLoading && <Badge style={{ marginLeft: 8 }}>{documents.length}件</Badge>}
        </CardHeader>

        {isLoading ? (
          <EmptyState description="読み込み中...">
            <Spinner size={24} />
          </EmptyState>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            }
            title="ドキュメントがありません"
            description="上のエリアからファイルをアップロードしてください"
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ファイル名</th>
                  <th>タイプ</th>
                  <th className="text-right">サイズ</th>
                  <th className="text-right">チャンク数</th>
                  <th className="text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <span style={{ fontWeight: 500 }}>{doc.filename}</span>
                    </td>
                    <td>
                      <Badge>{doc.mimeType}</Badge>
                    </td>
                    <td className="text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      {(doc.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      {doc.chunkCount}
                    </td>
                    <td className="text-center">
                      <Button variant="danger" size="sm" onClick={() => handleDelete(doc.id)}>
                        削除
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
