# RAG System Design Specification

## 1. Overview

TypeScript レイヤードアーキテクチャによる RAG (Retrieval-Augmented Generation) システム。
ローカル Docker 環境で動作し、最終的に Cloudflare / Vercel での管理を想定した構成。

**自作 RAG**: AWS Bedrock Knowledge Base 等の外部マネージド API は使用せず、Embedding・検索・生成の全パイプラインを自前で構築する。

---

## 2. Tech Stack

| Category | Choice | Notes |
|---|---|---|
| Language | TypeScript (strict) | |
| Package Manager | pnpm | monorepo workspace |
| Backend | NestJS | レイヤードアーキテクチャ |
| Frontend | Next.js (App Router) + React | |
| Gateway | NestJS (独立アプリ) | Basic Auth + JWT |
| Vector DB | LanceDB | 文字列カラム併用メタデータフィルタ |
| Embedding | Ollama (`nomic-embed-text` or `bge-m3`) | ローカルDocker |
| Generation LLM | Ollama | 将来 GPT Responses API への切替を想定 |
| Container | Docker / Docker Compose | ローカル開発環境 |
| Test Runner | Vitest | ユニット / インテグレーション |
| Linter | ESLint + @typescript-eslint | |
| Type Check | TypeScript (`tsc --noEmit`) | strict mode |
| API Docs | @nestjs/swagger + Swagger UI | OpenAPI 3.0 自動生成 |

---

## 3. Monorepo Structure

```
home-repo/
├── pnpm-workspace.yaml
├── package.json                  # root scripts, devDependencies
├── docker-compose.yml            # ollama, lancedb, api, gateway, web
├── apps/
│   ├── web/                      # Next.js App Router
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── chat/             # RAG対話画面
│   │   │   ├── documents/        # ナレッジ管理画面
│   │   │   └── api/              # Next.js Route Handlers (BFF)
│   │   ├── lib/
│   │   │   └── api/
│   │   │       ├── factory.ts    # createJsonClient / createBinaryClient
│   │   │       ├── json-client.ts
│   │   │       └── binary-client.ts
│   │   ├── features/
│   │   │   ├── chat/
│   │   │   │   └── endpoints/    # chat 用 API 呼び出し
│   │   │   └── documents/
│   │   │       └── endpoints/    # document 用 API 呼び出し
│   │   └── ...
│   ├── api/                      # NestJS Backend
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── presentation/     # Controllers, DTOs, Guards
│   │   │   ├── application/      # UseCases / Services
│   │   │   ├── domain/           # Entities, Ports (interfaces), ValueObjects
│   │   │   └── infrastructure/   # Adapters (Ollama, LanceDB, etc.)
│   │   └── ...
│   └── gateway/                  # NestJS Gateway
│       ├── src/
│       │   ├── main.ts
│       │   ├── auth/             # Basic Auth guard, JWT guard
│       │   ├── rate-limit/       # Throttler
│       │   └── proxy/            # api / web へのリバースプロキシ
│       └── ...
└── packages/
    └── shared/                   # 共通型定義、定数、ユーティリティ
        ├── src/
        │   ├── types/
        │   └── constants/
        └── ...
```

---

## 4. Communication Routes (Frontend → Backend)

JSON とバイナリ (buffer) で通信経路を分離する。

### 4.1 Factory Pattern

```typescript
// apps/web/lib/api/factory.ts

export function createJsonClient(baseUrl: string) {
  return {
    async get<T>(path: string, params?: Record<string, string>): Promise<T> { ... },
    async post<T>(path: string, body: unknown): Promise<T> { ... },
    async postStream(path: string, body: unknown): Promise<ReadableStreamDefaultReader<Uint8Array>> { ... },
    async put<T>(path: string, body: unknown): Promise<T> { ... },
    async delete<T>(path: string): Promise<T> { ... },
  };
}

export function createBinaryClient(baseUrl: string) {
  return {
    async upload(path: string, file: File | Blob, metadata?: Record<string, string>): Promise<Response> { ... },
    async download(path: string): Promise<Blob> { ... },
  };
}
```

### 4.2 Usage (各 endpoint ディレクトリ)

```typescript
// apps/web/features/chat/endpoints/chat-api.ts
import { createJsonClient } from '@/lib/api/factory';

const client = createJsonClient(process.env.NEXT_PUBLIC_API_URL!);

export async function queryRag(question: string) {
  return client.post<{ answer: string; sources: string[] }>('/rag/query', { question });
}

// apps/web/features/documents/endpoints/document-api.ts
import { createBinaryClient } from '@/lib/api/factory';

const binaryClient = createBinaryClient(process.env.NEXT_PUBLIC_API_URL!);

export async function uploadDocument(file: File) {
  return binaryClient.upload('/documents/upload', file);
}

export async function downloadDocument(id: string) {
  return binaryClient.download(`/documents/${id}`);
}
```

### 4.3 Content-Type Routing

| Route | Method | Content-Type | Client |
|---|---|---|---|
| `/rag/query` | POST | `application/json` | json-client |
| `/rag/stream` | POST | `application/json` → `ReadableStream` (NDJSON) | json-client (stream via fetch) |
| `/documents/upload` | POST | `multipart/form-data` | binary-client |
| `/documents/:id` | GET | `application/octet-stream` | binary-client |
| `/documents` | GET | `application/json` | json-client |
| `/documents/:id` | DELETE | `application/json` | json-client |
| `/documents/:id/chunks` | GET | `application/json` | json-client |

---

## 5. Backend Architecture (NestJS - Layered)

### 5.1 Layer Definitions

```
presentation/    → HTTP の入出力のみを担当
  ├── controllers/     ルーティング、DTOバリデーション
  ├── dto/             Request/Response DTO (class-validator)
  └── guards/          認証・認可ガード

application/     → ユースケース、ビジネスロジックのオーケストレーション
  └── services/        各ユースケース1サービス

domain/          → ビジネスルール、エンティティ、ポート（インターフェース）
  ├── entities/        ドメインエンティティ
  ├── ports/           インターフェース定義（LLM、Embedding、VectorStore、DocumentLoader）
  └── value-objects/   値オブジェクト

infrastructure/  → 外部依存の実装（アダプタ）
  ├── ollama/          OllamaEmbeddingAdapter, OllamaGenerationAdapter
  ├── lancedb/         LanceVectorStoreAdapter
  ├── loaders/         MarkdownLoader, PdfLoader, ImageLoader
  └── config/          環境設定
```

### 5.2 Port Definitions (Domain層)

```typescript
// domain/ports/embedding.port.ts
export interface EmbeddingPort {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// domain/ports/generation.port.ts
export interface GenerationPort {
  generate(prompt: string, context: string[]): Promise<string>;
  generateStream(prompt: string, context: string[]): AsyncGenerator<string>;
}

// domain/ports/vector-store.port.ts
export interface VectorStorePort {
  upsert(id: string, vector: number[], metadata: Record<string, unknown>): Promise<void>;
  search(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<SearchResult[]>;
  delete(id: string): Promise<void>;
}

// domain/ports/document-loader.port.ts
export interface DocumentLoaderPort {
  load(file: Buffer, filename: string): Promise<DocumentChunk[]>;
}
```

### 5.3 Infrastructure Adapters

| Port | Adapter | Implementation |
|---|---|---|
| `EmbeddingPort` | `OllamaEmbeddingAdapter` | Ollama REST API (`/api/embeddings`) |
| `GenerationPort` | `OllamaGenerationAdapter` | Ollama REST API (`/api/generate` or `/api/chat`) |
| `VectorStorePort` | `LanceVectorStoreAdapter` | LanceDB TypeScript client |
| `DocumentLoaderPort` | `MarkdownLoader` / `PdfLoader` / `ImageLoader` | 各フォーマットパーサー |

将来の GPT 対応時は `OpenAiResponsesAdapter` を `GenerationPort` の実装として追加し、DI で切替。

---

## 6. RAG Pipeline

### 6.1 Ingestion Flow

```
File Upload (multipart)
  → DocumentLoaderPort.load()        # フォーマット別パース + チャンク分割
  → EmbeddingPort.embedBatch()        # チャンクごとにベクトル化
  → VectorStorePort.upsert()          # LanceDB に格納（ベクトル + メタデータ）
```

### 6.2 Query Flow

```
User Question (JSON)
  → EmbeddingPort.embed(question)     # 質問をベクトル化
  → VectorStorePort.search(vector)    # LanceDB から類似チャンク検索
  → GenerationPort.generate(prompt, contexts)  # LLM で回答生成
  → Response (answer + sources)
```

### 6.3 Streaming Flow (fetch ReadableStream)

Backend (NestJS): `GenerationPort.generateStream()` から `AsyncGenerator<string>` を受け取り、NDJSON として `Response` ストリームに書き出す。

```typescript
// Backend: presentation/controllers/rag.controller.ts
@Post('stream')
async stream(@Body() dto: QueryRagDto, @Res() res: Response) {
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');

  for await (const chunk of this.ragService.streamQuery(dto.question)) {
    res.write(JSON.stringify(chunk) + '\n');
  }
  res.end();
}
```

Frontend (Next.js): `fetch` の `response.body` (ReadableStream) を `getReader()` で逐次読み取り。

```typescript
// Frontend: features/chat/endpoints/chat-api.ts
export async function streamRag(question: string) {
  const response = await fetch(`${API_URL}/rag/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  return {
    async *[Symbol.asyncIterator]() {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;
        for (const line of lines) {
          if (line.trim()) yield JSON.parse(line);
        }
      }
    },
  };
}
```

### 6.4 Chunking Strategy

- **Markdown**: セクション（heading）単位で分割、前後コンテキストをオーバーラップ
- **PDF**: ページ単位 or 段落単位で分割
- **画像**: OCR でテキスト抽出後チャンク化（将来対応）
- **チャンクサイズ**: 500-1000 tokens 目安
- **オーバーラップ**: 50-100 tokens
- **メタデータ**: `source` (ファイル名), `page`, `section`, `createdAt`, `updatedAt`

---

## 7. Gateway

### 7.1 認証フロー

```
Client Request
  → Basic Auth (全リクエスト一次防御)
  → JWT Validation (API 個別認可)
  → Proxy to Backend (api) or Frontend (web)
```

### 7.2 構成

- 独立 NestJS アプリ (`apps/gateway`)
- `@nestjs/throttler` によるレート制限
- Basic Auth: `Authorization: Basic <base64>` ヘッダー検証
- JWT: Bearer トークン検証、有効期限チェック

### 7.3 Rate Limiting

| Endpoint Group | Limit | Window | Notes |
|---|---|---|---|
| General API | 100 req | 1 min | 全般的なエンドポイント |
| RAG Query | 20 req | 1 min | LLM 呼び出しは高コスト |
| Document Upload | 10 req | 1 min | ファイル処理は高負荷 |
| Document List/Get | 60 req | 1 min | 読み取り系 |
| Auth endpoints | 5 req | 1 min | ブルートフォース対策 |

レスポンスヘッダー:
- `X-RateLimit-Limit`: ウィンドウ内の最大リクエスト数
- `X-RateLimit-Remaining`: 残りリクエスト数
- `X-RateLimit-Reset`: リセット時刻 (Unix timestamp)
- `Retry-After`: 429 時のリトライ秒数

---

## 8. Docker Compose

```yaml
services:
  ollama:
    image: ollama/ollama
    ports: ["11434:11434"]
    volumes: ["ollama-data:/root/.ollama"]

  api:
    build: ./apps/api
    ports: ["3001:3001"]
    depends_on: [ollama]
    environment:
      - OLLAMA_URL=http://ollama:11434
      - LANCE_DB_PATH=/data/lancedb
    volumes: ["lance-data:/data/lancedb"]

  gateway:
    build: ./apps/gateway
    ports: ["3000:3000"]
    depends_on: [api]
    environment:
      - API_URL=http://api:3001
      - BASIC_AUTH_USER
      - BASIC_AUTH_PASS
      - JWT_SECRET

  web:
    build: ./apps/web
    ports: ["3002:3002"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3000

volumes:
  ollama-data:
  lance-data:
```

---

## 9. API Endpoints

### RAG

| Method | Path | Description |
|---|---|---|
| POST | `/rag/query` | 質問応答（JSON） |
| POST | `/rag/stream` | 質問応答（fetch ReadableStream / NDJSON） |

### Documents

| Method | Path | Description |
|---|---|---|
| POST | `/documents/upload` | ドキュメントアップロード（multipart） |
| GET | `/documents` | ドキュメント一覧 |
| GET | `/documents/:id` | ドキュメントダウンロード（binary） |
| DELETE | `/documents/:id` | ドキュメント削除 |
| GET | `/documents/:id/chunks` | チャンク一覧 |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | ヘルスチェック |

---

## 10. API Documentation (Swagger / OpenAPI)

### 10.1 導入

`@nestjs/swagger` により、Controller のデコレーションから OpenAPI 3.0 スペックを自動生成する。

### 10.2 アクセス

| URL | 内容 |
|---|---|
| `http://localhost:3001/api/docs` | Swagger UI（インタラクティブな API テスト画面） |
| `http://localhost:3001/api/docs-json` | OpenAPI 3.0 JSON（外部ツール連携用） |

### 10.3 セットアップ

```typescript
// apps/api/src/main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('RAG System API')
    .setDescription('自作 RAG システムの API ドキュメント')
    .setVersion('1.0')
    .addTag('RAG', '質問応答エンドポイント')
    .addTag('Documents', 'ドキュメント管理エンドポイント')
    .addTag('Health', 'ヘルスチェック')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3001);
}
```

### 10.4 Controller デコレーション例

```typescript
@ApiTags('RAG')
@Controller('rag')
export class RagController {
  @Post('query')
  @ApiOperation({ summary: 'RAG 質問応答', description: '質問を受け取り、類似ドキュメントを検索して回答を生成する' })
  @ApiBody({ type: QueryRagDto })
  @ApiResponse({ status: 200, description: '回答成功', type: RagResponseDto })
  @ApiResponse({ status: 429, description: 'レート制限超過' })
  async query(@Body() dto: QueryRagDto) { ... }

  @Post('stream')
  @ApiOperation({ summary: 'RAG 質問応答（ストリーミング）', description: 'NDJSON で逐次トークンを返す' })
  @ApiBody({ type: QueryRagDto })
  @ApiResponse({ status: 200, description: 'ストリーミング回答' })
  async stream(@Body() dto: QueryRagDto, @Res() res: Response) { ... }
}

@ApiTags('Documents')
@Controller('documents')
export class DocumentController {
  @Post('upload')
  @ApiOperation({ summary: 'ドキュメントアップロード' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, description: 'アップロード成功', type: DocumentResponseDto })
  async upload(@UploadedFile() file: Express.Multer.File) { ... }
}
```

### 10.5 DTO と Swagger プロパティ

```typescript
export class QueryRagDto {
  @ApiProperty({ description: 'ユーザーの質問', example: 'LanceDBの特徴は？' })
  @IsString()
  question: string;
}

export class RagResponseDto {
  @ApiProperty({ description: '生成された回答' })
  answer: string;

  @ApiProperty({ description: '参照元チャンクのメタデータ', type: [ChunkMetadataDto] })
  sources: ChunkMetadataDto[];
}
```

---

## 12. Testing Strategy

### 10.1 方針

- **ユニットテスト**: Domain層ロジック、チャンク分割、DTOバリデーション
- **インテグレーションテスト**: Adapter層（Ollama / LanceDB をモック or テスト用インスタンスで検証）
- **E2E**: 現時点ではスコープ外（将来追加）

### 10.2 Pre-push Command

```json
// package.json (root)
{
  "scripts": {
    "pre-git-push": "pnpm run typecheck && pnpm run lint && pnpm run test"
  }
}
```

| Step | Command | Tool | 対象 |
|---|---|---|---|
| 1. Type Check | `tsc --noEmit` | TypeScript | 全ワークスペース |
| 2. Lint | `eslint .` | ESLint + @typescript-eslint | 全ワークスペース |
| 3. Unit/Integration Test | `vitest run` | Vitest | `apps/api`, `apps/gateway`, `apps/web`, `packages/shared` |

### 10.3 Test Scope per Layer

| Layer | テスト対象 | モック方針 |
|---|---|---|
| Domain | エンティティ、ValueObject、チャンク分割ロジック | なし（純粋関数） |
| Application | Service（ユースケース） | Port をモック |
| Presentation | Controller（リクエスト/レスポンス変換） | Service をモック |
| Infrastructure | OllamaAdapter, LanceAdapter | テスト用 Ollama インスタンス or HTTP モック |
| Frontend | API client factory, endpoint 呼び出し | fetch をモック |

### 10.4 Vitest Config

```typescript
// vitest.workspace.ts
export default defineWorkspace([
  'apps/api/vitest.config.ts',
  'apps/gateway/vitest.config.ts',
  'apps/web/vitest.config.ts',
  'packages/shared/vitest.config.ts',
]);
```

---

## 13. Future Extensions

- **GPT Responses API 対応**: `OpenAiResponsesAdapter` を `GenerationPort` に実装、env 変数で切替
- **画像 RAG**: OCR + 画像 Embedding
- **マルチユーザー**: 認証スコープ別ナレッジベース分離
- **Cloudflare / Vercel 移行**: LanceDB → Turso or Cloudflare D1 + Vectorize への移行パス
