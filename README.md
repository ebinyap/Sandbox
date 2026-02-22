# Steam Analyzer

Steam アカウントの所持ゲーム・プレイ時間・価格情報を統合分析する Electron デスクトップアプリケーション。

## 機能一覧

### メイン機能

- **レコメンドエンジン** — タグ重み付きスコアリングで、自分の嗜好に合った未知のゲームを発見
- **類似ゲーム検索** — TF-IDF ベースのタグ特異性スコアで、特定ゲームに似た作品を検索

### 補助機能

- **プレイ統計** — プレイ時間の月別/四半期別/年別集計、傾向の可視化
- **積みゲー分析** — 未プレイ・放置ゲームの分類と救出優先度スコア
- **ウォッチリスト** — 気になるゲームの価格追跡（フォルダ分け対応）
- **セール予測** — 過去のセール履歴からゲーム固有のパターンを分析
- **購入タイミングアドバイザー** — 今買うべきか待つべきかを判定根拠付きで提示
- **コスパ分析** — 1時間あたりの費用でゲームをランキング
- **アクティビティログ** — プロセス監視ベースのプレイ記録
- **セール検知・通知** — ウォッチリスト登録ゲームの価格変動をトースト通知
- **データエクスポート** — ライブラリ・ウォッチリストの JSON エクスポート

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Electron |
| UI | HTML / CSS / JavaScript |
| 価格情報 | IsThereAnyDeal API |
| プレイ時間補助 | HowLongToBeat |
| データ保存 | electron-store（JSON） |
| プロセス監視 | ps-list |
| テスト | Jest / Playwright |

## クイックスタート

### 前提条件

- Node.js v18 以上
- npm（Node.js に同梱）
- Steam API キー（[Steam Web API](https://steamcommunity.com/dev/apikey) で取得）
- IsThereAnyDeal API キー（[ITAD](https://isthereanydeal.com/dev/) で取得）

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発モードで起動
npm start
```

### テスト実行

```bash
# ユニット＋統合テスト（Jest: 183テスト）
npm test

# カバレッジレポート付き
npm run test:coverage

# E2Eテスト（Playwright + Electron: 24テスト）
npm run test:e2e

# ファイル変更時の自動再実行
npm run test:watch
```

テストの詳細は [docs/testing-guide.md](docs/testing-guide.md) を参照してください。

### パッケージング

```bash
# ディレクトリ出力（テスト用）
npm run pack

# インストーラー生成（配布用）
npm run dist
```

対応プラットフォーム: Windows（NSIS）/ macOS（DMG）/ Linux（AppImage）

## アーキテクチャ

4 層のレイヤー構成で、外部 API とロジックと UI を明確に分離しています。

```
┌────────────────────────────────────────────────┐
│  renderer層（UI）                                │
│  index.html / nav.js / tabs/ / components/     │
│  → 表示のみ。API 直接呼び出し禁止               │
├────────────────────────────────────────────────┤
│  main層（Electron 制御）              IPC 通信   │
│  main.js / preload.js / ipc-handlers.js        │
│  store.js / cache-manager.js                   │
│  activity-monitor.js / notifier.js / tray.js   │
├────────────────────────────────────────────────┤
│  engine層（純ロジック）                          │
│  scorer.js / tag-manager.js / aggregator.js    │
│  backlog-analyzer.js / sale-predictor.js       │
│  cost-analyzer.js / purchase-advisor.js        │
│  activity-analyzer.js / models.js              │
│  → 外部 API を一切知らない                      │
├────────────────────────────────────────────────┤
│  api層（外部 API 通信）                          │
│  steam.js / itad.js / hltb.js                  │
│  → 外部 API → 内部モデルへの変換を担当           │
└────────────────────────────────────────────────┘
```

### 設計原則

1. 外部 API のレスポンスを直接上位層で扱わない
2. すべて内部共通データモデル（`Game`, `AppError` 等）に正規化する
3. 分析ロジック（engine層）は API を知らない
4. 部分的な失敗を前提とし、得られたデータだけで最善の表示をする
5. すべての実装は TDD（RED-GREEN-REFACTOR）に従う

## プロジェクト構成

```
steam-analyzer/
├── README.md                        ← このファイル
├── CLAUDE.md                        ← AI 開発指示書
├── PROGRESS.md                      ← 進捗管理
├── steam-analyzer-spec.md           ← 仕様書本体（全29セクション）
├── package.json
├── playwright.config.js             ← E2E テスト設定
├── assets/
│   ├── icon.png / icon.ico / icon.icns
├── docs/
│   ├── decisions.md                 ← 設計判断記録
│   └── testing-guide.md             ← テストガイド
├── src/
│   ├── api/                         ← 外部 API 通信
│   │   ├── steam.js                 ←   Steam Web API
│   │   ├── itad.js                  ←   IsThereAnyDeal API
│   │   └── hltb.js                  ←   HowLongToBeat
│   ├── engine/                      ← 純ロジック
│   │   ├── models.js                ←   データモデル定義
│   │   ├── scorer.js                ←   レコメンドスコアリング
│   │   ├── tag-manager.js           ←   タグ集計・TF-IDF
│   │   ├── aggregator.js            ←   マルチソースマージ
│   │   ├── backlog-analyzer.js      ←   積みゲー分析
│   │   ├── sale-predictor.js        ←   セール予測
│   │   ├── cost-analyzer.js         ←   コスパ分析
│   │   ├── purchase-advisor.js      ←   購入タイミング判定
│   │   └── activity-analyzer.js     ←   アクティビティ集計
│   ├── main/                        ← Electron 制御
│   │   ├── main.js                  ←   エントリポイント
│   │   ├── preload.js               ←   contextBridge（16 API）
│   │   ├── ipc-handlers.js          ←   IPC ハンドラー（16チャネル）
│   │   ├── store.js                 ←   永続化（electron-store）
│   │   ├── cache-manager.js         ←   キャッシュ（TTL + SWR）
│   │   ├── activity-monitor.js      ←   プロセス監視
│   │   ├── notifier.js              ←   トースト通知
│   │   └── tray.js                  ←   システムトレイ
│   └── renderer/                    ← UI
│       ├── index.html               ←   エントリポイント
│       ├── nav.js                   ←   タブ切り替え
│       ├── tabs/
│       │   ├── store-recommend.js   ←   ストア/レコメンド
│       │   ├── watchlist.js         ←   ウォッチリスト
│       │   ├── statistics.js        ←   統計
│       │   ├── backlog.js           ←   積みゲー
│       │   └── settings.js          ←   設定
│       └── components/
│           ├── game-card.js         ←   ゲームカード
│           └── price-bar.js         ←   価格バー
└── tests/
    ├── engine/                      ← engine層テスト（69テスト）
    ├── api/                         ← API層テスト（20テスト）
    ├── main/                        ← main層テスト（59テスト）
    ├── renderer/                    ← renderer層テスト（14テスト）
    ├── integration/                 ← 統合テスト（21テスト）
    └── e2e/                         ← E2Eテスト（24テスト）
```

## 使用する外部 API

| API | 用途 | キーの取得先 |
|-----|------|------------|
| Steam Web API | 所持ゲーム一覧、ゲーム詳細、プレイ時間 | [Steam Web API Key](https://steamcommunity.com/dev/apikey) |
| IsThereAnyDeal API | 現在価格、最安値、セール履歴 | [ITAD Developer](https://isthereanydeal.com/dev/) |
| HowLongToBeat | 平均クリア時間 | npm パッケージ（API キー不要） |

API キーはアプリの設定画面から入力します。

## 開発ガイド

### TDD（テスト駆動開発）

このプロジェクトは RED-GREEN-REFACTOR サイクルを必須としています。

1. **RED** — 失敗するテストを先に書く
2. **GREEN** — テストを通す最小限の実装を書く
3. **REFACTOR** — テストが通ったまま品質改善

### コミットメッセージ規約

```
[RED]      モジュール: 内容
[GREEN]    モジュール: 内容
[REFACTOR] モジュール: 内容
[FIX]      モジュール: 内容
[DOCS]     対象: 内容
[PROGRESS] PROGRESS.md 更新
```

### ドキュメント

| ファイル | 内容 |
|---------|------|
| [CLAUDE.md](CLAUDE.md) | AI 開発セッション用の指示書 |
| [steam-analyzer-spec.md](steam-analyzer-spec.md) | 仕様書本体（全29セクション、約1200行） |
| [docs/testing-guide.md](docs/testing-guide.md) | テスト項目一覧・実行方法・トラブルシューティング |
| [docs/decisions.md](docs/decisions.md) | 実装中の設計判断記録 |
| [PROGRESS.md](PROGRESS.md) | 進捗管理 |

## ライセンス

Private
