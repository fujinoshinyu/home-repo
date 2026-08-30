# ──────────────────────────────────────────────
#  home-repo — Justfile
# ──────────────────────────────────────────────

# デフォルトレシピ一覧を表示
default:
    @just --list

# ── 依存関係 ──────────────────────────────────

# 全パッケージの依存関係をインストール
install:
    pnpm install

# ── Docker (ollama / api / gateway / web) ─────

# Docker 全サービスをビルド＆起動（要: Docker Desktop 起動）
up:
    @docker info > /dev/null 2>&1 || (echo "Error: Docker is not running. Start Docker Desktop first." && exit 1)
    docker compose up -d --build

# Docker 全サービスを停止
down:
    -docker compose down 2>/dev/null
    @echo "Down complete."

# Docker 全サービスを停止し、ボリュームも削除（データ全消去）
clean:
    -docker compose down -v --remove-orphans 2>/dev/null
    -docker system prune -f 2>/dev/null
    @echo "Clean complete."

# Docker のログを表示（Ctrl+C で終了、要: Docker Desktop 起動）
logs:
    docker compose logs -f

# Docker のログをサービス別に表示
logs-api:
    docker compose logs -f api

logs-gateway:
    docker compose logs -f gateway

logs-web:
    docker compose logs -f web

logs-ollama:
    docker compose logs -f ollama

# ── 開発環境（ローカル）──────────────────────

# 全サービスをローカルで並列起動（ollama は brew 版を使用）
dev: install ollama-start
    pnpm -r --parallel run dev

# ollama を起動（すでに動いていればスキップ）
ollama-start:
    @pgrep -x ollama > /dev/null 2>&1 && echo "ollama is already running" || (echo "Starting ollama..." && ollama serve &)

# 全サービスをローカルで並列起動（ollama を Docker で起動）
dev-docker: install
    docker compose up -d ollama
    pnpm -r --parallel run dev

# 個別サービスのローカル起動
dev-api:
    pnpm --filter api run start:dev

dev-gateway:
    pnpm --filter gateway run start:dev

dev-web:
    pnpm --filter web run dev

# ── ビルド ────────────────────────────────────

# 全パッケージをビルド
build:
    pnpm -r run build

# 個別ビルド
build-api:
    pnpm --filter api run build

build-gateway:
    pnpm --filter gateway run build

build-web:
    pnpm --filter web run build

build-swagger:
    pnpm --filter @home-repo/swagger run build

# Swagger スペック生成
swagger-gen:
    pnpm --filter @home-repo/swagger run generate

# ── 品質チェック ──────────────────────────────

# 型チェック（全パッケージ）
typecheck:
    pnpm -r run typecheck

# リント
lint:
    pnpm run lint

# テスト（全パッケージ）
test:
    pnpm -r run test

# プッシュ前チェック（型チェック + リント + テスト）
pre-push: typecheck lint test

# ── ポート解放 ─────────────────────────────────

# 使用中のポートを強制解放
kill-ports:
    @echo "Killing processes on ports 3000, 3001, 3002, 11434..."
    @lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    @lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    @lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    @lsof -ti:11434 | xargs kill -9 2>/dev/null || true
    @echo "Done."

# 特定ポートのプロセスを終了
kill-port port:
    @lsof -ti:{{port}} | xargs kill -9 2>/dev/null || true
    @echo "Port {{port}} freed."

# ── リセット ──────────────────────────────────

# 開発環境を完全リセット（node_modules + dist + Docker ボリューム）
reset:
    -docker compose down -v --remove-orphans 2>/dev/null
    -docker system prune -f 2>/dev/null
    rm -rf node_modules
    rm -rf apps/*/node_modules
    rm -rf apps/*/dist
    rm -rf packages/*/node_modules
    rm -rf packages/*/dist
    rm -rf .turbo
    @echo "Reset complete. Run 'just install' to reinstall."
