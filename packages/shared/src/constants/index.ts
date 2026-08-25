export const CHUNK_DEFAULTS = {
  MIN_SIZE: 500,
  MAX_SIZE: 1000,
  OVERLAP: 100,
} as const;

export const RATE_LIMITS = {
  GENERAL: { limit: 100, window: 60_000 },
  RAG_QUERY: { limit: 20, window: 60_000 },
  DOCUMENT_UPLOAD: { limit: 10, window: 60_000 },
  DOCUMENT_READ: { limit: 60, window: 60_000 },
  AUTH: { limit: 5, window: 60_000 },
} as const;

export const ERROR_CODES = {
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  EMBEDDING_FAILED: 'EMBEDDING_FAILED',
  GENERATION_FAILED: 'GENERATION_FAILED',
  VECTOR_STORE_ERROR: 'VECTOR_STORE_ERROR',
} as const;
