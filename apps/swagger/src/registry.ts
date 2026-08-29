import { z } from 'zod';
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import {
  RagQueryRequestSchema,
  RagQueryResponseSchema,
  RagStreamChunkSchema,
  DocumentResponseSchema,
  DocumentListResponseSchema,
  ChunkListResponseSchema,
  HealthResponseSchema,
  ErrorResponseSchema,
} from './schemas';

export const registry = new OpenAPIRegistry();

const IdParamSchema = z.object({ id: z.string().uuid() });

// --- RAG ---

registry.registerPath({
  method: 'post',
  path: '/rag/query',
  tags: ['RAG'],
  summary: 'RAG 質問応答',
  description: '質問を受け取り、類似ドキュメントを検索して回答を生成する',
  request: { body: { content: { 'application/json': { schema: RagQueryRequestSchema } } } },
  responses: {
    200: { description: '回答成功', content: { 'application/json': { schema: RagQueryResponseSchema } } },
    429: { description: 'レート制限超過', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/rag/stream',
  tags: ['RAG'],
  summary: 'RAG 質問応答（ストリーミング）',
  description: 'NDJSON で逐次トークンを返す',
  request: { body: { content: { 'application/json': { schema: RagQueryRequestSchema } } } },
  responses: {
    200: { description: 'ストリーミング回答', content: { 'application/x-ndjson': { schema: RagStreamChunkSchema } } },
  },
});

// --- Documents ---

registry.registerPath({
  method: 'post',
  path: '/documents/upload',
  tags: ['Documents'],
  summary: 'ドキュメントアップロード',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] },
        },
      },
    },
  },
  responses: {
    201: { description: 'アップロード成功', content: { 'application/json': { schema: DocumentResponseSchema } } },
    400: { description: 'サポートされていないファイル形式', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/documents',
  tags: ['Documents'],
  summary: 'ドキュメント一覧',
  responses: {
    200: { description: '一覧取得成功', content: { 'application/json': { schema: DocumentListResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/documents/{id}',
  tags: ['Documents'],
  summary: 'ドキュメントダウンロード',
  request: { params: IdParamSchema },
  responses: {
    200: { description: 'ダウンロード成功', content: { 'application/octet-stream': { schema: z.string() } } },
    404: { description: 'ドキュメントが見つからない', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/documents/{id}',
  tags: ['Documents'],
  summary: 'ドキュメント削除',
  request: { params: IdParamSchema },
  responses: {
    200: { description: '削除成功' },
    404: { description: 'ドキュメントが見つからない', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/documents/{id}/chunks',
  tags: ['Documents'],
  summary: 'チャンク一覧',
  request: { params: IdParamSchema },
  responses: {
    200: { description: 'チャンク一覧', content: { 'application/json': { schema: ChunkListResponseSchema } } },
    404: { description: 'ドキュメントが見つからない', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

// --- Health ---

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'ヘルスチェック',
  responses: {
    200: { description: 'ヘルスチェック成功', content: { 'application/json': { schema: HealthResponseSchema } } },
  },
});

// --- Generator ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateOpenAPIDocument(): any {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'RAG System API',
      description: '自作 RAG システムの API ドキュメント',
      version: '1.0.0',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Gateway' }],
  });
}
