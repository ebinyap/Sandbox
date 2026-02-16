# Current Phase
implementation

## Current Task
Phase 6: Electron・UI (main層) — 完了。renderer は Phase 7 で対応。

## TDD Phase
completed

## What was just done
- Phase 1-5 完了（基盤、API、キャッシュ、分析エンジン、アクティビティ）
- Phase 6 main層 完了:
  - ipc-handlers.js（createHandler ラッパー、registerHandlers） — 3テスト
  - notifier.js（notify, notifySale — Electron Notification ラッパー）
  - tray.js（createTray — システムトレイ制御）
- **全15スイート、115テスト合格**

## What to do next
1. Phase 7: renderer/ — UI実装（tabs, components）
2. Phase 7: 統合テスト

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
- [x] src/main/cache-manager.js（TTL管理、SWR）
- [x] src/engine/scorer.js（レコメンドスコアリング）
- [x] src/engine/sale-predictor.js（セール予測）
- [x] src/engine/backlog-analyzer.js（積みゲー分析）
- [x] src/engine/cost-analyzer.js（コスパ分析）
- [x] src/engine/purchase-advisor.js（購入タイミング判定）
- [x] src/engine/activity-analyzer.js（月別/四半期/年別集計）
- [x] src/main/activity-monitor.js（プロセス監視）
- [x] src/main/ipc-handlers.js（IPC制御）
- [x] src/main/notifier.js（トースト通知）
- [x] src/main/tray.js（システムトレイ）
- [ ] src/renderer/（UI — Phase 7）
