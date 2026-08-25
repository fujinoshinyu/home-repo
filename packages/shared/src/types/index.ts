// --- RAG ---

export interface RagQueryRequest {
  question: string;
}

export interface RagQueryResponse {
  answer: string;
  sources: ChunkMetadata[];
}

export interface RagStreamChunk {
  type: 'token' | 'sources' | 'done';
  token?: string;
  sources?: ChunkMetadata[];
}

// --- Documents ---

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

export interface ChunkMetadata {
  id: string;
  source: string;
  page?: number;
  section?: string;
  score: number;
}

export interface ChunkResponse {
  id: string;
  documentId: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface ChunkListResponse {
  chunks: ChunkResponse[];
  total: number;
}

// --- Health ---

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    ollama: 'connected' | 'disconnected';
    lancedb: 'connected' | 'disconnected';
  };
}

// --- Errors ---

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}
