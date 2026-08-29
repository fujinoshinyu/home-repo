'use client';

import { useState, useEffect, useRef } from 'react';
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  type DocumentResponse,
} from '@/features/documents/endpoints/document-api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadDocument(file);
      await fetchDocuments();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('このドキュメントを削除しますか？')) return;
    try {
      await deleteDocument(id);
      await fetchDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1>ドキュメント管理</h1>

      <div style={{ marginBottom: 24 }}>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleUpload}
          disabled={isUploading}
          accept=".md,.txt,.pdf,.json,.png,.jpg,.jpeg,.webp"
        />
        {isUploading && <span> アップロード中...</span>}
      </div>

      {isLoading ? (
        <p>読み込み中...</p>
      ) : documents.length === 0 ? (
        <p>ドキュメントがありません</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>ファイル名</th>
              <th style={{ textAlign: 'left', padding: 8 }}>タイプ</th>
              <th style={{ textAlign: 'right', padding: 8 }}>サイズ</th>
              <th style={{ textAlign: 'right', padding: 8 }}>チャンク数</th>
              <th style={{ textAlign: 'center', padding: 8 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: 8 }}>{doc.filename}</td>
                <td style={{ padding: 8 }}>{doc.mimeType}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{(doc.size / 1024).toFixed(1)} KB</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{doc.chunkCount}</td>
                <td style={{ padding: 8, textAlign: 'center' }}>
                  <button onClick={() => handleDelete(doc.id)} style={{ color: 'red' }}>
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
