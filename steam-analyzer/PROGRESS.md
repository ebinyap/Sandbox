# Current Phase
implementation

## Current Task
Phase 2: API層 — 完了

## TDD Phase
completed

## What was just done
- Phase 1 完了（models.js, tag-manager.js, aggregator.js, store.js）
- api/steam.js 実装（fetchOwnedGames, fetchAppDetails, filterGamesOnly） — テスト10件
- api/itad.js 実装（fetchCurrentPrice, fetchPriceHistory） — テスト6件
- api/hltb.js 実装（fetchHltb） — テスト4件
- 全API: 正常レスポンス・HTTPエラー・ネットワークエラーのパターンをカバー
- 全API: 外部エラーを AppError に変換

## What to do next
1. Phase 3: キャッシュ・エラー — cache-manager.js（TTL管理、SWR、リトライ）
2. Phase 4: 分析エンジン — scorer.js（タグプロファイル、レコメンドスコアリング）
3. Phase 4: 分析エンジン — sale-predictor.js, backlog-analyzer.js
4. Phase 4: 分析エンジン — cost-analyzer.js, purchase-advisor.js

## Unresolved issues
なし

## Completed modules checklist
- [x] src/engine/models.js（データモデルファクトリ）
- [x] src/engine/tag-manager.js（タグ集計、TF-IDF）
- [x] src/engine/aggregator.js（マルチソースマージ）
- [x] src/main/store.js（永続化）
- [x] src/api/steam.js（所持ゲーム取得、詳細取得、タイプフィルタ）
- [x] src/api/itad.js（現在価格、セール履歴）
- [x] src/api/hltb.js（クリア時間）
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
