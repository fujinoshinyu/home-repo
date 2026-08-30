import { createAsyncUploadClient, type AsyncUploadOptions } from '@/lib/api/factory';

const asyncClient = createAsyncUploadClient();

export interface DocumentResponse {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function uploadDocument(
  file: File,
  options?: AsyncUploadOptions,
): Promise<DocumentResponse> {
  return asyncClient.upload<DocumentResponse>('/documents/upload', file, undefined, options);
}
