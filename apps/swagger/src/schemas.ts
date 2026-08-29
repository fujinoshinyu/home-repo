import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// --- RAG ---

export const RagQueryRequestSchema = z
  .object({
    question: z.string().min(1).openapi({ description: 'ユーザーの質問', example: 'LanceDBの特徴は？' }),
  })
  .openapi('RagQueryRequest');

export const ChunkMetadataSchema = z.object({
  id: z.string(),
  source: z.string(),
  score: z.number(),
});

export const RagQueryResponseSchema = z
  .object({
    answer: z.string().openapi({ description: '生成された回答' }),
    sources: z.array(ChunkMetadataSchema).openapi({ description: '参照元チャンク' }),
  })
  .openapi('RagQueryResponse');

export const RagStreamChunkSchema = z
  .object({
    type: z.enum(['token', 'sources', 'done']),
    token: z.string().optional(),
    sources: z.array(ChunkMetadataSchema).optional(),
  })
  .openapi('RagStreamChunk');

// --- Documents ---

export const DocumentResponseSchema = z
  .object({
    id: z.string().uuid(),
    filename: z.string(),
    mimeType: z.string(),
    size: z.number(),
    chunkCount: z.number(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('DocumentResponse');

export const DocumentListResponseSchema = z
  .object({
    documents: z.array(DocumentResponseSchema),
    total: z.number(),
  })
  .openapi('DocumentListResponse');

export const ChunkResponseSchema = z
  .object({
    id: z.string(),
    documentId: z.string().uuid(),
    content: z.string(),
    metadata: z.record(z.unknown()),
  })
  .openapi('ChunkResponse');

export const ChunkListResponseSchema = z
  .object({
    chunks: z.array(ChunkResponseSchema),
    total: z.number(),
  })
  .openapi('ChunkListResponse');

// --- Health ---

export const HealthResponseSchema = z
  .object({
    status: z.enum(['ok', 'error']),
    timestamp: z.string().datetime(),
    services: z.object({
      ollama: z.enum(['connected', 'disconnected']),
      lancedb: z.enum(['connected', 'disconnected']),
    }),
  })
  .openapi('HealthResponse');

// --- Errors ---

export const ErrorResponseSchema = z
  .object({
    statusCode: z.number(),
    message: z.string(),
    error: z.string(),
  })
  .openapi('ErrorResponse');

// --- Types (inferred from schemas) ---

export type RagQueryRequest = z.infer<typeof RagQueryRequestSchema>;
export type RagQueryResponse = z.infer<typeof RagQueryResponseSchema>;
export type RagStreamChunk = z.infer<typeof RagStreamChunkSchema>;
export type DocumentResponse = z.infer<typeof DocumentResponseSchema>;
export type DocumentListResponse = z.infer<typeof DocumentListResponseSchema>;
export type ChunkResponse = z.infer<typeof ChunkResponseSchema>;
export type ChunkListResponse = z.infer<typeof ChunkListResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
