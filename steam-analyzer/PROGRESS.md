# Current Phase
implementation

## Current Task
Phase 4: 分析エンジン — 完了

## TDD Phase
completed

## What was just done
- Phase 1 完了（models.js, tag-manager.js, aggregator.js, store.js）
- Phase 2 完了（steam.js, itad.js, hltb.js）
- Phase 3 完了（cache-manager.js — TTL管理、SWR、invalidate/clear）
- Phase 4 完了:
  - scorer.js（calculateTagProfile, scoreCandidate, rankCandidates, scoreSimilarCandidate） — 14テスト
  - backlog-analyzer.js（classifyStatus, calculateRescuePriority, analyzeBacklog） — 14テスト
  - sale-predictor.js（predictSale — 周期分析、確度判定） — 6テスト
  - cost-analyzer.js（calculateCostPerHour, rankByCostEfficiency） — 6テスト
  - purchase-advisor.js（advise — buy_now/wait/expensive/unknown 判定） — 5テスト
- **全12スイート、101テスト合格**

## What to do next
1. Phase 5: アクティビティ — activity-monitor.js, activity-analyzer.js
2. Phase 6: Electron・UI — ipc-handlers.js, notifier.js, tray.js, renderer/
3. Phase 7: 統合・仕上げ

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
- [ ] src/engine/activity-analyzer.js
- [ ] src/main/ipc-handlers.js
- [ ] src/main/notifier.js
- [ ] src/main/tray.js
- [ ] src/main/activity-monitor.js
- [ ] src/renderer/
