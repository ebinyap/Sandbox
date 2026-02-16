# Current Phase
implementation

## Current Task
Phase 1: 基盤 — 完了

## TDD Phase
completed

## What was just done
- プロジェクト初期セットアップ（package.json, ディレクトリ構造, Jest）
- データモデル定義（models.js: createGame, createAppError, createFetchResult）
- engine/tag-manager.js 実装（aggregateTags, calculateTagRarity） — テスト9件
- engine/aggregator.js 実装（mergeGamePair, mergeGames） — テスト9件
- main/store.js 実装（library, tagProfile, settings, watchlist CRUD） — テスト8件

## What to do next
1. Phase 2: API層 — steam.js（Steam API通信、ライブラリ取得、タイプフィルタ）
2. Phase 2: API層 — itad.js（ITAD API通信、価格・セール履歴取得）
3. Phase 2: API層 — hltb.js（HLTB通信、クリア時間取得）
4. Phase 3: キャッシュ・エラー — cache-manager.js
5. Phase 4: 分析エンジン — scorer.js, sale-predictor.js 等

## Unresolved issues
なし

## Completed modules checklist
- [x] src/engine/models.js（データモデルファクトリ）
- [x] src/engine/tag-manager.js（タグ集計、TF-IDF）
- [x] src/engine/aggregator.js（マルチソースマージ）
- [x] src/main/store.js（永続化）
- [ ] src/api/steam.js
- [ ] src/api/itad.js
- [ ] src/api/hltb.js
- [ ] src/main/cache-manager.js
- [ ] src/engine/scorer.js
- [ ] src/engine/sale-predictor.js
- [ ] src/engine/backlog-analyzer.js
- [ ] src/engine/cost-analyzer.js
- [ ] src/engine/purchase-advisor.js
- [ ] src/engine/activity-analyzer.js
- [ ] src/main/ipc-handlers.js
- [ ] src/main/notifier.js
- [ ] src/main/tray.js
- [ ] src/main/activity-monitor.js
- [ ] src/renderer/
