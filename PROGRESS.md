# Current Phase
完了 — 全モジュール実装・統合テスト・E2Eテスト・全IPC連携完了

## Current Task
なし（全タスク完了）

## TDD Phase
completed

## What was just done
- **バグ修正: refresh-library が Steam API を呼ばない問題を修正**
  - 原因: main.js が registerHandlers に steamApi (fetchOwnedGames) を渡していなかった
  - 修正: ipc-handlers.js の refresh-library ハンドラーが deps.steamApi を使ってストア設定（API Key, Steam ID）を読み、fetchOwnedGames を呼ぶように変更
  - main.js に steamApi: { fetchOwnedGames, fetchWishlist } を接続
- **新機能: Steam ウィッシュリスト → ウォッチリスト インポート**
  - steam.js に fetchWishlist(steamId) を追加
  - ipc-handlers.js に import-wishlist ハンドラーを追加（重複チェック付き）
  - preload.js に importWishlist API を追加
  - settings.js に「Import Wishlist」ボタンを追加
- テスト追加: 10テスト（steam.test.js: 4, ipc-handlers.test.js: 6）
- **Jest: 40スイート、376テスト合格**

### Previous
- Phase 1-7 完了（基盤、API、キャッシュ、分析エンジン、アクティビティ、Electron制御、renderer UI）
- 統合テスト追加（4スイート、21テスト）:
  - tests/integration/recommendation-pipeline.test.js
  - tests/integration/analysis-pipeline.test.js
  - tests/integration/activity-pipeline.test.js
  - tests/integration/cache-api-pipeline.test.js
- Electron main.js / preload.js 実装
- パッケージング設定（electron-builder, Win/Mac/Linux対応）
- IPC ハンドラー全16種実装:
  - get-library / get-settings / set-settings
  - get-watchlist / set-watchlist / add-watchlist-entry / remove-watchlist-entry
  - get-backlog-analysis / get-statistics / get-recommendations
  - refresh-library（Steam API→マージ→ストア保存）
  - get-activity-summary（月別/四半期/年別集計）
  - search-similar（類似ゲーム検索）
  - get-sale-prediction（セール予測＋購入アドバイス）
  - clear-cache / export-data
  - preload.js も全16 API対応
- renderer タブ UX改善（全タブにLoading/Error/Retry追加）:
  - statistics: 統計カード＋Best Value＋年別/月別アクティビティ（バーチャート付き）
  - backlog: ステータス色分け・進捗バー・救出優先度
  - watchlist: ターゲット価格表示・達成通知・削除ボタン
  - settings: IPC設定読み書き＋ライブラリ更新・データエクスポート・キャッシュクリアボタン
  - store-recommend: モード切替＋類似ゲーム検索＋セール予測＋ウォッチリスト追加
- renderer コンポーネントテスト追加（14テスト）
- IPC ハンドラーテスト拡充（36テスト）
- E2Eテスト追加（Playwright + Electron — 24テスト）:
  - ウィンドウ表示・サイズ
  - 5タブナビゲーション切り替え
  - Store/Recommend モード切替
  - Settings フォーム・データ管理ボタン
  - IPC全チャネル通信（Library/Settings/Watchlist/Statistics/Backlog/Activity/Cache/Export）
  - Watchlist CRUD ラウンドトリップ
  - CSP検証
  - contextIsolation / nodeIntegration セキュリティ
- CSP対応: インラインスクリプト→外部ファイル化（nav.js）
- main.js E2Eモード対応（--e2e フラグ、トレイスキップ、window-all-closed で終了）
- アセットアイコン（icon.png/ico/icns）ダミー配置
- **Jest: 20スイート、183テスト合格**
- **Playwright: 24 E2Eテスト合格**

## What to do next
- アイコンを本番用デザインに差し替え
- `npm run pack` でパッケージングテスト（electron-builder）
- CI/CDパイプラインでE2Eテストを自動実行

## Unresolved issues
なし

## Completed modules checklist
- [x] src/engine/models.js（データモデルファクトリ）
- [x] src/engine/tag-manager.js（タグ集計、TF-IDF）
- [x] src/engine/aggregator.js（マルチソースマージ）
- [x] src/main/store.js（永続化）
- [x] src/api/steam.js（所持ゲーム取得、詳細取得、ウィッシュリスト取得、タイプフィルタ）
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
- [x] src/main/ipc-handlers.js（IPC制御 — 全17ハンドラー、import-wishlist追加）
- [x] src/main/notifier.js（トースト通知）
- [x] src/main/tray.js（システムトレイ）
- [x] src/main/main.js（Electronエントリポイント + E2Eモード対応）
- [x] src/main/preload.js（contextBridge — 全17 API、importWishlist追加）
- [x] src/renderer/index.html（エントリポイント）
- [x] src/renderer/nav.js（タブ切り替え — CSP準拠外部スクリプト）
- [x] src/renderer/tabs/（5タブ — 全IPC連携・UX改善済み）
- [x] src/renderer/components/（price-bar, game-card — テスト済み）
- [x] tests/integration/（4統合テストスイート）
- [x] tests/renderer/（コンポーネントテスト）
- [x] tests/e2e/（Playwright E2Eテスト — 24テスト）
