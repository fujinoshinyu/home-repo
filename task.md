# Implementation Tasks

> DESIGN.md の設計に基づくタスク分解。依存関係の順序で実装する。

---

## T1: Monorepo 基盤セットアップ

**目的**: pnpm workspace + Docker + 開発ツールの一式を揃える

- [x] T1.1: `pnpm-workspace.yaml`, root `package.json`, root `tsconfig.json` 作成
- [x] T1.2: `docker-compose.yml` 作成（ollama, api, gateway, web, volumes）
- [x] T1.3: ESLint (`@typescript-eslint`) + Prettier 設定（root）
- [x] T1.4: Vitest workspace 設定 (`vitest.config.ts` with projects)
- [x] T1.5: `pnpm run pre-git-push` スクリプト定義（typecheck → lint → test）
- [x] T1.6: `.gitignore`, `.env.example` 作成

---

## T2: Shared Package (`packages/shared`)

**目的**: 全ワークスペースで共有する型・定数を定義

- [x] T2.1: `src/types/` — API リクエスト/レスポンス型、ドメイン共通型
- [x] T2.2: `src/constants/` — エラーコード、チャンク設定デフォルト値
- [x] T2.3: `package.json`, `tsconfig.json`（各 app から参照可能なビルド設定）

---

## T3: Domain Layer (`apps/api/src/domain`)

**目的**: ビジネスルールと外部依存なしのインターフェースを定義

- [x] T3.1: Port 定義 (CQRS 分離済み)
  - `ports/commands/embedding.command.ts` — `EmbeddingCommand`
  - `ports/commands/generation.command.ts` — `GenerationCommand`
  - `ports/commands/vector-store.command.ts` — `VectorStoreCommand`
  - `ports/commands/document.command.ts` — `DocumentCommand`
  - `ports/queries/vector-store.query.ts` — `VectorStoreQuery`
  - `ports/queries/document.query.ts` — `DocumentQuery`
- [x] T3.2: Entity 定義
  - `entities/document.entity.ts` — `Document`
  - `entities/chunk.entity.ts` — `Chunk`
- [x] T3.3: ValueObject 定義
  - `value-objects/search-result.vo.ts` — `SearchResult`
  - `value-objects/document-chunk.vo.ts` — `DocumentChunk`

---

## T4: Infrastructure Layer (`apps/api/src/infrastructure`)

**目的**: Domain の Port を実装するアダプタ群

- [x] T4.1: Ollama 設定 (`config/ollama.config.ts`) — URL, モデル名を env から読み込み
- [x] T4.2: `OllamaEmbeddingAdapter` — `/api/embeddings` 呼び出し
- [x] T4.3: `OllamaGenerationAdapter` — `/api/chat` 呼び出し（ストリーミング対応）
- [x] T4.4: LanceDB 設定 (`config/lancedb.config.ts`) — DB パス
- [x] T4.5: `LanceVectorStoreCommandAdapter` (upsert/delete) + `LanceVectorStoreQueryAdapter` (search)
- [x] T4.6: Document Loaders
  - `loaders/markdown.loader.ts` — heading 単位チャンク分割
  - `loaders/pdf.loader.ts` — ページ/段落単位チャンク分割
- [x] T4.7: Infrastructure モジュール (`infrastructure.module.ts`) — DI バインディング

---

## T5: Application Layer (`apps/api/src/application`)

**目的**: ユースケースのオーケストレーション

- [x] T5.1: `RagService` — query（同期）, stream（AsyncGenerator）
- [x] T5.2: `DocumentService` — upload, list, getById, delete, getChunks
- [x] T5.3: Application モジュール (`application.module.ts`)

---

## T6: Presentation Layer (`apps/api/src/presentation`)

**目的**: HTTP リクエスト/レスポンスの処理 + Swagger ドキュメント

- [x] T6.1: DTO 定義 (Zod スキーマ + nestjs-zod)
  - `apps/swagger/src/schemas.ts` — API 契約定義（Zod スキーマ）
  - `apps/swagger/src/registry.ts` — OpenAPI エンドポイント定義
  - `apps/api/src/presentation/dto/query-rag.dto.ts` — Zod → NestJS DTO
- [x] T6.2: `RagController` — `/rag/query`, `/rag/stream`
- [x] T6.3: `DocumentController` — `/documents` CRUD + `/documents/:id/chunks`
- [x] T6.4: `HealthController` — `/health`
- [x] T6.5: Swagger (`apps/swagger` ワークスペース)
  - Zod スキーマから OpenAPI 3.1 スペックを自動生成
  - `pnpm --filter swagger generate` で `openapi.json` を出力
- [x] T6.6: Presentation モジュール (`presentation.module.ts`)

---

## T7: API アプリ組み立て (`apps/api`)

**目的**: NestJS アプリのエントリポイントとモジュール統合

- [x] T7.1: `app.module.ts` — ConfigModule + PresentationModule 統合
- [x] T7.2: `main.ts` — CORS, Swagger UI (`/api/docs`), ValidationPipe, グローバルパイプ
- [x] T7.3: `Dockerfile` 作成

---

## T8: Gateway (`apps/gateway`)

**目的**: 認証・認可・レート制限・プロキシ

- [ ] T8.1: Basic Auth Guard (`auth/basic-auth.guard.ts`)
- [ ] T8.2: JWT Guard (`auth/jwt.guard.ts`)
- [ ] T8.3: Rate Limiting (`rate-limit/`) — `@nestjs/throttler` 設定
- [ ] T8.4: Proxy (`proxy/`) — api へのリバースプロキシ
- [ ] T8.5: `app.module.ts`, `main.ts`
- [ ] T8.6: `Dockerfile` 作成

---

## T9: Frontend (`apps/web`)

**目的**: Next.js App Router で UI を構築

- [ ] T9.1: Next.js 初期セットアップ (`create-next-app` or 手動)
- [ ] T9.2: API Client Factory (`lib/api/factory.ts`)
  - `createJsonClient` — GET / POST / PUT / DELETE
  - `createBinaryClient` — upload / download
  - `postStream` — fetch ReadableStream (NDJSON)
- [ ] T9.3: Chat Feature
  - `features/chat/endpoints/chat-api.ts` — queryRag, streamRag
  - `app/chat/page.tsx` — 対話 UI（ストリーミング表示対応）
- [ ] T9.4: Documents Feature
  - `features/documents/endpoints/document-api.ts` — upload, list, download, delete, getChunks
  - `app/documents/page.tsx` — ドキュメント管理 UI
- [ ] T9.5: Layout (`app/layout.tsx`, `app/page.tsx`)
- [ ] T9.6: `Dockerfile` 作成

---

## T10: テスト

**目的**: 各層のユニット/インテグレーションテスト

- [ ] T10.1: Domain テスト — ValueObject, チャンク分割ロジック（純粋関数）
- [ ] T10.2: Application テスト — RagService, DocumentService（Port モック）
- [ ] T10.3: Infrastructure テスト — OllamaAdapter, LanceAdapter（HTTP モック or テストインスタンス）
- [ ] T10.4: Presentation テスト — Controller（Service モック）
- [ ] T10.5: Frontend テスト — API client factory（fetch モック）

---

## 実装順序

```
T1 (基盤) → T2 (shared) → T3 (domain) → T4 (infrastructure)
                                          ↓
                                    T5 (application) → T6 (presentation) → T7 (api組立)
                                                                              ↓
                                              T8 (gateway) ← ─ ─ ─ ─ ─ ─ ─ ┘
                                                    ↓
                                              T9 (frontend)
                                                    ↓
                                              T10 (テスト)
```

T1〜T7 は API 側の縦切りで進め、T8 (gateway), T9 (frontend) は API が動いてから並行可能。
T10 は各タスクと並行して進めるが、全層完成後にカバレッジ確認を実施。
