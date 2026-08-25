export interface RagQueryRequest {
  question: string;
}

export interface RagQueryResponse {
  answer: string;
  sources: ChunkMetadata[];
}

export interface ChunkMetadata {
  id: string;
  source: string;
  page?: number;
  section?: string;
  score: number;
}

export interface DocumentResponse {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChunkResponse {
  id: string;
  documentId: string;
  content: string;
  metadata: Record<string, unknown>;
}
