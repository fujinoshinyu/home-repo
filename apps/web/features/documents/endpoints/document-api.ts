import { createJsonClient, createBinaryClient } from '@/lib/api/factory';

const jsonClient = createJsonClient();
const binaryClient = createBinaryClient();

export interface DocumentResponse {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentListResponse {
  documents: DocumentResponse[];
  total: number;
}

export async function uploadDocument(file: File): Promise<DocumentResponse> {
  const res = await binaryClient.upload('/documents/upload', file);
  return res.json();
}

export async function listDocuments(): Promise<DocumentListResponse> {
  return jsonClient.get<DocumentListResponse>('/documents');
}

export async function deleteDocument(id: string): Promise<void> {
  await jsonClient.delete(`/documents/${id}`);
}

export async function downloadDocument(id: string): Promise<Blob> {
  return binaryClient.download(`/documents/${id}`);
}
