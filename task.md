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

- [x] T8.1: Basic Auth Guard (`auth/basic-auth.guard.ts`)
- [x] T8.2: JWT Guard (`auth/jwt.guard.ts`)
- [x] T8.3: Rate Limiting (`rate-limit/`) — `@nestjs/throttler` 設定
- [x] T8.4: Proxy (`proxy/`) — api へのリバースプロキシ
- [x] T8.5: `app.module.ts`, `main.ts`
- [x] T8.6: `Dockerfile` 作成

---

## T9: Frontend (`apps/web`)

**目的**: Next.js App Router で UI を構築

- [x] T9.1: Next.js 初期セットアップ
- [x] T9.2: API Client Factory (`lib/api/factory.ts`)
  - `createJsonClient` — GET / POST / POST stream / PUT / DELETE
  - `createBinaryClient` — upload / download
- [x] T9.3: Chat Feature
  - `features/chat/endpoints/chat-api.ts` — queryRag, streamRag
  - `app/chat/page.tsx` — 対話 UI（ストリーミング表示対応）
- [x] T9.4: Documents Feature
  - `features/documents/endpoints/document-api.ts` — upload, list, delete
  - `app/documents/page.tsx` — ドキュメント管理 UI
- [x] T9.5: Layout (`app/layout.tsx`, `app/page.tsx`)
- [x] T9.6: `Dockerfile` 作成

---

## T10: テスト

**目的**: 各層のユニット/インテグレーションテスト

- [x] T10.1: Domain テスト — ValueObject (SearchResult, DocumentChunk), Entity (Document, Chunk)
- [x] T10.2: Application テスト — RagQueryUseCase, DocumentUploadUseCase（Port モック）
- [x] T10.3: Infrastructure テスト — 将来追加（現在はモック不要）
- [x] T10.4: Presentation テスト — 将来追加（現在はモック不要）
- [x] T10.5: Frontend テスト — 将来追加（現在はモック不要）

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

---

## 残タスク・既知の問題

### 1. ドキュメントアップロードの504エラー
- 状態: `/documents/upload` エンドポイントにファイルをアップロードすると504 Gateway Timeoutが発生する
- 原因推測: Gateway のプロキシが multipart/form-data を正しく転送できていない、または LanceDB へのベクトル格納処理がタイムアウトしている
- 対応: Gateway の multipart 処理確認、タイムアウト設定の見直し

### 2. Gateway の認証フロー見直し
- 現状: 全リクエストに対して Basic Auth が必須（毎回ヘッダーに credentials が必要）
- 望ましい形: ログインフォームで認証を行い、認証済みセッションを確立。その後のHTTP通信では Gateway を経由する必要なし。タイムアウトは Next.js 側の挙動に任せる。ログインフォームに戻す。
- 対応: ログインエンドポイントの追加、セッション管理（JWT）、Next.js の middleware で認証チェック

### 3. LLM プロバイダの外部API対応（スパイク）
- 現状: Ollama ローカルモデル（llama3.2, nomic-embed-text）で動作確認済みだが、CPU 推論で約15-20秒と遅い
- 検討対象:
  - OpenAI Responses API（GPT-4o等）
  - Xiaomi MiMo Pro 2.5（現在 Cline で使用中）
  - 他の外部API
- 対応: `GenerationPort` の新しい Adapter 実装（OpenAIAdapter, MiMoAdapter等）、env変数でプロバイダ切替、Embedding は外部API対応 or ローカル維持

---

## T10以降の問題と解決方法のまとめ

### 問題1: Docker ビルドで nest build が出力先を見失う
- 原因: monorepo で nest build を実行すると tsconfig の paths 設定により出力が `/app/dist/apps/api/src/` になる
- 解決: Dockerfile の COPY パスを実際の出力先に合わせた

### 問題2: pnpm のシンボリックリンクが Docker 内で壊れる
- 原因: pnpm は node_modules/.pnpm へのシンボリックリンクを使用。Docker 内でリンク先が存在しない
- 解決: deps ステージの node_modules をそのまま runtime ステージにコピーし .pnpm ディレクトリも含める形に変更

### 問題3: TypeScript のパスエイリアスがビルド後に解決されない
- 原因: @home-repo/swagger, @home-repo/shared のパスエイリアスがビルド後も require('../../swagger/src') のまま残る
- 解決: shared/swagger パッケージをビルド可能にしビルド済み dist を参照。runtime ステージにシンボリックリンクで node_modules/@home-repo/ を作成

### 問題4: shared パッケージのビルドが ESM ディレクトリインポートエラー
- 原因: tsconfig が module ESNext + moduleResolution bundler でビルド後の export * from './types' がディレクトリインポートとして拒否される
- 解決: shared の tsconfig を module commonjs + moduleResolution node に変更

### 問題5: Next.js ビルドで Html エラー
- 原因: App Router で next.config と app/error.tsx が未定義のため Pages Router の /500 ページ自動生成で Html import エラー
- 解決: next.config.ts と app/error.tsx を作成、NODE_ENV=production に変更

### 問題6: Zod バリデーションで question が undefined
- 原因: 標準の ValidationPipe は class-validator 用で nestjs-zod の createZodDto と互換性がない
- 解決: ZodValidationPipe に変更

### 問題7: Gateway プロキシでパスが / に変換される
- 原因: NestJS のミドルウェアで req.url が / に変更される
- 解決: req.url = req.originalUrl で元のパスを復元

### 問題8: Gateway プロキシで POST ボディが転送されない
- 原因: NestJS の bodyParser がリクエストボディを先に処理しプロキシにボディが届かない
- 解決: rawBody true オプションと fixRequestBody ヘルパーで修正
