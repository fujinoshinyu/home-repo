// --- Chunking ---

export const CHUNK_DEFAULTS = {
  MIN_SIZE: 500,
  MAX_SIZE: 1000,
  OVERLAP: 100,
} as const;

// --- Rate Limiting ---

export const RATE_LIMITS = {
  GENERAL: { limit: 100, window: 60_000 },
  RAG_QUERY: { limit: 20, window: 60_000 },
  DOCUMENT_UPLOAD: { limit: 10, window: 60_000 },
  DOCUMENT_READ: { limit: 60, window: 60_000 },
  AUTH: { limit: 5, window: 60_000 },
} as const;

// --- Error Codes ---

export const ERROR_CODES = {
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  EMBEDDING_FAILED: 'EMBEDDING_FAILED',
  GENERATION_FAILED: 'GENERATION_FAILED',
  VECTOR_STORE_ERROR: 'VECTOR_STORE_ERROR',
} as const;

// --- Supported File Types ---

export const SUPPORTED_MIME_TYPES = [
  'text/markdown',
  'text/plain',
  'application/pdf',
  'application/json',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

// --- API Paths ---

export const API_PATHS = {
  RAG_QUERY: '/rag/query',
  RAG_STREAM: '/rag/stream',
  DOCUMENTS: '/documents',
  DOCUMENT_UPLOAD: '/documents/upload',
  HEALTH: '/health',
} as const;

// --- Ollama Defaults ---

export const OLLAMA_DEFAULTS = {
  URL: 'http://localhost:11434',
  EMBEDDING_MODEL: 'nomic-embed-text',
  GENERATION_MODEL: 'llama3.2',
} as const;

// --- Swagger ---

export const SWAGGER_PATH = '/api/docs';
export const SWAGGER_JSON_PATH = '/api/docs-json';
