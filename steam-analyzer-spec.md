# Steam Analyzer — 改訂仕様書（統合版 v2）

---

## ■ 仕様書メタ情報

**バージョン:** 2.2
**最終更新日:** 2026-02-16
**ステータス:** 設計完了・実装前

### 変更履歴

| バージョン | 日付 | 変更概要 |
|-----------|------|---------|
| 1.0 | — | 初版。基本設計・レイヤー構成・画面構成 |
| 2.0 | 2026-02-16 | キャッシュ戦略、エラーハンドリング、積みゲー分析、レコメンドエンジン、ウォッチリスト再設計、セール予測、アクティビティログ、類似ゲーム検索、購入タイミングアドバイザー、コスパ分析、発売状態フィルタを追加。タブ構成を5タブに改訂 |
| 2.1 | 2026-02-16 | セクションID・変更依頼テンプレート・依存関係マップ追加。RED-GREEN-REFACTORサイクル強制を明記。セッション継続性設計（PROGRESS.md・コミット規約・実装順序・セッション開始/終了手順）を追加 |
| 2.2 | 2026-02-16 | CLAUDE.md（プロジェクト指示書）を分離。仕様書は詳細リファレンス、CLAUDE.mdは毎セッション読む薄い指示書という役割分担を明確化 |

### セクションID一覧（Claudeへの変更指示用）

本仕様書の各セクションには `[SEC-xxx]` のIDを付与している。
Claudeに仕様変更を依頼する際は **セクションIDを指定** することで、対象箇所を正確に特定できる。

| ID | セクション名 | 概要 |
|----|-------------|------|
| SEC-OVERVIEW | 概要 | アプリの目的・機能一覧 |
| SEC-TECH | 技術スタック | 使用技術・ライブラリ |
| SEC-PRINCIPLES | 設計原則 | アーキテクチャの基本方針 |
| SEC-LAYERS | レイヤー構成 | api / engine / main / renderer の責務 |
| SEC-MODEL-GAME | データモデル: Game | 中核データモデル |
| SEC-MODEL-ERROR | データモデル: AppError | エラーモデル |
| SEC-MODEL-FETCH | データモデル: FetchResult | 集約レスポンスモデル |
| SEC-MODEL-CACHE | データモデル: CacheEntry | キャッシュモデル |
| SEC-MODEL-TAG | データモデル: TagProfile / TagRarity | タグプロファイルモデル |
| SEC-MODEL-BACKLOG | データモデル: BacklogEntry | 積みゲー分析モデル |
| SEC-MODEL-SALE | データモデル: SalePrediction | セール予測モデル |
| SEC-MODEL-WATCH | データモデル: WatchlistFolder / WatchlistEntry | ウォッチリストモデル |
| SEC-MODEL-ACTIVITY | データモデル: PlaySession / ActivityLog | アクティビティモデル |
| SEC-CACHE | キャッシュ戦略 | TTL・更新戦略・オフライン対応 |
| SEC-ERROR | エラーハンドリング | リトライ・UI表示パターン・ログ |
| SEC-TAB-STORE | 画面: ストア/レコメンド | 統合タブの全仕様 |
| SEC-TAB-WATCH | 画面: ウォッチリスト | フォルダ管理・購入アドバイザー |
| SEC-TAB-STATS | 画面: 統計 | 可視化・アクティビティログ表示 |
| SEC-TAB-BACKLOG | 画面: 積みゲー | サマリー・救出リスト |
| SEC-TAB-SETTINGS | 画面: 設定 | 全設定項目 |
| SEC-ACTIVITY | アクティビティログ | プロセス監視の仕組み |
| SEC-RECOMMEND | レコメンドエンジン | スコアリング・タグプロファイル・フィードバック |
| SEC-SIMILAR | 類似ゲーム検索 | TF-IDF・起点・スコアリング |
| SEC-EXTLINK | 外部リンク方針 | shell.openExternal の統一ルール |
| SEC-API | API構成 | Steam / ITAD / HLTB の利用範囲 |
| SEC-EXTEND | 拡張性設計 | 新サービス追加手順 |
| SEC-TEST | テスト戦略 | テスト対象モジュール一覧 |
| SEC-TOKEN | トークン削減運用ルール | 開発時のやりとり方針 |
| SEC-SESSION | セッション管理・作業再開プロトコル | PROGRESS.md・中断/再開ルール・ブランチ戦略 |
| SEC-IMPL-ORDER | 実装順序ガイドライン | 依存関係を考慮した推奨実装順序 |
| SEC-FUTURE | 将来想定拡張 | 未実装の拡張アイデア |

### Claudeへの仕様変更依頼テンプレート

仕様変更をClaude（AI）に依頼する際は、以下の形式を推奨する。
これにより変更の意図・範囲・影響が明確になり、誤った変更を防げる。

```
【変更種別】追加 / 修正 / 削除 / 移動
【対象セクション】SEC-xxx
【変更内容】具体的な変更内容を記述
【理由】なぜこの変更が必要か
【影響範囲】他セクションへの波及（わかる範囲で）
```

**例1: フィールド追加**
```
【変更種別】追加
【対象セクション】SEC-MODEL-GAME
【変更内容】Game モデルに `achievementRate: number | null` フィールドを追加
【理由】実績達成率をプレイ深度の指標として使いたい
【影響範囲】SEC-TAB-STATS（統計タブに実績達成率の表示を追加する必要あり）、SEC-LAYERS（steam.js で実績情報を取得する必要あり）
```

**例2: 仕様修正**
```
【変更種別】修正
【対象セクション】SEC-CACHE
【変更内容】HLTBのTTLを「7〜30日」から「30〜90日」に変更
【理由】HLTBのデータ変化頻度が想定より低く、API負荷を減らしたい
【影響範囲】なし（キャッシュ設定の数値変更のみ）
```

**例3: 機能削除**
```
【変更種別】削除
【対象セクション】SEC-TAB-SETTINGS
【変更内容】「F2Pの積みゲーカウント対象ON/OFF」設定を削除し、常にOFF（除外）とする
【理由】設定項目を減らしてシンプルにしたい
【影響範囲】SEC-TAB-BACKLOG（F2Pに関するエッジケース記述を更新）、SEC-MODEL-BACKLOG（F2P関連の記述を更新）
```

### 依存関係マップ（セクション間の影響確認用）

仕様変更時に波及を確認するためのマップ。

```
SEC-MODEL-GAME（Gameモデル）
  ├─ 参照元: SEC-LAYERS（全レイヤー）, SEC-CACHE, SEC-ERROR
  ├─ 参照元: SEC-RECOMMEND, SEC-SIMILAR, SEC-TAB-STORE
  ├─ 参照元: SEC-MODEL-BACKLOG, SEC-MODEL-WATCH, SEC-MODEL-SALE
  └─ 変更時の影響: 広範囲。フィールド追加はapi層での取得追加が必要

SEC-MODEL-ERROR（AppError）
  ├─ 参照元: SEC-ERROR, SEC-CACHE, SEC-LAYERS（api層・main層）
  └─ 変更時の影響: エラーハンドリング全体

SEC-MODEL-TAG（TagProfile / TagRarity）
  ├─ 参照元: SEC-RECOMMEND, SEC-SIMILAR, SEC-TAB-SETTINGS
  └─ 変更時の影響: レコメンド精度に直結

SEC-CACHE（キャッシュ戦略）
  ├─ 参照元: SEC-ERROR（リトライ戦略と連動）, SEC-LAYERS（cache-manager）
  └─ 変更時の影響: パフォーマンス・API負荷

SEC-RECOMMEND（レコメンドエンジン）
  ├─ 参照元: SEC-TAB-STORE（レコメンドモード）, SEC-TAB-SETTINGS（タグプロファイル設定）
  ├─ 依存先: SEC-MODEL-TAG, SEC-MODEL-GAME, SEC-LAYERS（scorer.js）
  └─ 変更時の影響: ディスカバリー体験の中核

SEC-SIMILAR（類似ゲーム検索）
  ├─ 参照元: SEC-TAB-STORE（ストアモード・レコメンドモード）, SEC-TAB-STATS（統計タブ）
  ├─ 依存先: SEC-MODEL-TAG（TagRarity）, SEC-RECOMMEND（共通スコアリング部品）
  └─ 変更時の影響: 起点UIの変更は SEC-TAB-STORE, SEC-TAB-STATS に波及

SEC-TAB-STORE（ストア/レコメンドタブ）
  ├─ 依存先: SEC-RECOMMEND, SEC-SIMILAR, SEC-MODEL-SALE, SEC-MODEL-WATCH
  └─ 変更時の影響: メインUIのため変更は慎重に

SEC-TAB-WATCH（ウォッチリストタブ）
  ├─ 依存先: SEC-MODEL-WATCH, SEC-MODEL-SALE, SEC-ERROR
  └─ 変更時の影響: フォルダ構造の変更は永続化データに影響

SEC-ACTIVITY（アクティビティログ）
  ├─ 参照元: SEC-TAB-STATS, SEC-TAB-SETTINGS
  ├─ 依存先: SEC-MODEL-ACTIVITY, SEC-LAYERS（activity-monitor.js）
  └─ 変更時の影響: 独立性が高い。他機能への波及は小さい

SEC-SESSION（セッション管理・作業再開プロトコル）
  ├─ 参照元: SEC-TOKEN, SEC-TEST
  ├─ 依存先: なし（運用ルールのため）
  └─ 変更時の影響: 開発プロセス全体。PROGRESS.md のフォーマット変更は全セッションに影響

SEC-IMPL-ORDER（実装順序ガイドライン）
  ├─ 参照元: SEC-SESSION（PROGRESS.md から参照）
  ├─ 依存先: SEC-LAYERS（モジュール間の依存関係に基づく）
  └─ 変更時の影響: 実装の進行順序。モジュール追加・削除時に更新が必要
```

### 仕様書の編集ルール

1. **変更時は必ず変更履歴を更新する** — バージョン番号を上げ、変更概要を記録
2. **セクションIDは変更しない** — 既存のIDを変更すると過去の変更依頼との対応が壊れる
3. **新規セクション追加時はIDを採番する** — `SEC-NEW-xxx` の形式で追加し、セクションID一覧にも追記
4. **削除するセクションは内容を消してIDと「削除済み」マークを残す** — 過去の参照を壊さないため
5. **データモデルのフィールド削除は非推奨** — 代わりに deprecated マークを付け、次のメジャーバージョンで削除
6. **影響範囲が不明な場合は依存関係マップを参照して確認してからClaude に変更を依頼する**

---

## ■ 概要 `[SEC-OVERVIEW]`

Steamアカウントの所持ゲーム・プレイ時間・価格情報を統合し、以下を行うWindows向けデスクトップアプリケーション。

**メイン機能**
- 自分の嗜好に合った未知のゲームの発見（ディスカバリー）
- タグ重み付きスコアリングによるレコメンド生成
- 類似ゲーム検索

**補助機能**
- プレイ傾向の可視化・統計
- 積みゲー（放置ゲー）分析
- ウォッチリスト管理（フォルダ分け対応）
- セール予測（ゲーム固有のパターン分析）
- セール検知および通知
- アクティビティログ（プロセス監視ベース）
- 購入タイミングアドバイザー
- コスパ分析
- データエクスポート

表示（UI）と分析エンジンを明確に分離し、外部API追加に耐える設計とする。

---

## ■ 技術スタック `[SEC-TECH]`

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Electron |
| UI | HTML / CSS / JavaScript |
| グラフ | Chart.js |
| 価格情報 | IsThereAnyDeal API |
| プレイ時間補助 | HowLongToBeat（npm） |
| データ保存 | electron-store（JSON） |
| 通知 | Electronトースト通知 |
| ドラッグ＆ドロップ | SortableJS |
| プロセス監視 | ps-list（npm） |

---

## ■ 設計原則 `[SEC-PRINCIPLES]`

1. 外部APIのレスポンスを直接上位層で扱わない
2. すべて内部共通データモデルに正規化する
3. UIはデータを表示するだけ
4. 分析ロジックはAPIを知らない
5. WebViewは表示専用（データ取得に使わない）
6. エラーも内部モデルに正規化する
7. 部分的な失敗を前提とし、得られたデータだけで最善の表示をする
8. 各モジュールは独立し、単体でテスト・リファクタリング可能とする
9. **すべての実装はRED-GREEN-REFACTORサイクルに従う（SEC-TEST参照）。テストなしのコード追加・変更は認めない**

---

## ■ レイヤー構成 `[SEC-LAYERS]`

### api層（外部依存）

| モジュール | 責務 |
|-----------|------|
| `steam.js` | Steam API通信、ライブラリ・ストア詳細・ウィッシュリスト取得 |
| `itad.js` | IsThereAnyDeal API通信、価格・セール履歴・最安値取得 |
| `hltb.js` | HowLongToBeat通信、平均クリア時間取得 |
| 将来追加adapter | 新サービス追加時にここに配置 |

**共通責務:** 外部サービスからデータ取得し、内部共通モデルへ変換して返す。外部エラーを `AppError` に変換する唯一の場所。

**フィルタリング責務（steam.js）:**
- `type: "game"` のみを通過させる
- `"tool"`, `"demo"`, `"dlc"`, `"music"`, `"video"` は除外
- DLCは統計タブの支出分析にのみ含め、積みゲー分析からは除外

---

### engine層（純ロジック）

| モジュール | 責務 |
|-----------|------|
| `scorer.js` | タグプロファイル算出、レコメンドスコアリング、類似ゲームスコアリング |
| `tag-manager.js` | タグ集計、タグ特異性スコア（TF-IDF）算出 |
| `sale-predictor.js` | セール周期分析、割引率傾向分析、次回セール予測 |
| `backlog-analyzer.js` | 積みゲーステータス分類、救出優先度スコア算出、サマリー集計 |
| `aggregator.js` | 複数ソースからのGameオブジェクトマージ、部分到着対応 |
| `activity-analyzer.js` | セッションデータから月別/四半期別/年別集計、プレイパターン分析 |
| `cost-analyzer.js` | コスパ計算（1時間あたり費用）、ランキング生成 |
| `purchase-advisor.js` | 購入タイミング判定（買い時/待ち/高い）、判断根拠生成 |

**共通責務:** 外部API仕様を一切知らない。内部共通モデルのみを入出力とする。

---

### main層（Electron制御）

| モジュール | 責務 |
|-----------|------|
| `tray.js` | トレイ常駐制御 |
| `notifier.js` | トースト通知発行 |
| `ipc-handlers.js` | IPC制御、FetchResultの集約、エラーまとめ |
| `store.js` | 永続化（electron-store） |
| `cache-manager.js` | TTL管理、Stale-While-Revalidate、リトライ制御 |
| `activity-monitor.js` | プロセス監視、セッション管理、永続化 |

---

### renderer層（UI）

| モジュール | 責務 |
|-----------|------|
| `index.html` | エントリポイント |
| `tabs/store-recommend.js` | ストア/レコメンド統合タブ |
| `tabs/watchlist.js` | ウォッチリストタブ |
| `tabs/statistics.js` | 統計タブ |
| `tabs/backlog.js` | 積みゲータブ |
| `tabs/settings.js` | 設定タブ |
| `components/price-bar.js` | 価格バーコンポーネント（共通） |
| `components/game-card.js` | ゲームカードコンポーネント（共通） |

**共通責務:** 表示とユーザー操作のみ。API直接呼び出し禁止。

---

## ■ 内部共通データモデル

### Game（中核モデル） `[SEC-MODEL-GAME]`

```
Game {
  id: string                    // appId
  title: string
  playtimeMinutes: number | null
  tags: string[]
  genres: string[]
  basePrice: number | null
  currentPrice: number | null
  historicalLow: number | null
  discountRate: number | null
  hltbMain: number | null
  reviewScore: number | null
  reviewCount: number | null
  lastPlayedAt: Date | null
  releaseDate: Date | null
  releaseStatus: string         // "released" | "upcoming" | "tbd"
  storeUrl: string | null
  itadUrl: string | null
  sourceFlags: string[]         // ["steam","itad"] 等
}
```

このモデルのみを engine と renderer が扱う。
外部サービスの形式変更は api層だけで吸収する。

---

### AppError（エラーモデル） `[SEC-MODEL-ERROR]`

```
AppError {
  source: string              // "steam" | "itad" | "hltb" | "cache" | "internal"
  type: string                // "network" | "rate_limit" | "auth" | "server" | "parse" | "unknown"
  message: string
  retryable: boolean
  retryAfterMs: number | null
  httpStatus: number | null
  timestamp: number
  context: string | null      // "fetchLibrary" | "fetchPrice:440" 等
  correlationId: string       // UUID。ログとUIの紐付け用
}
```

---

### FetchResult（集約レスポンスモデル） `[SEC-MODEL-FETCH]`

```
FetchResult {
  games: Game[]
  errors: AppError[]
  summary: {
    total: number
    succeeded: number
    failed: number
    sourceStatus: {
      steam: "ok" | "partial" | "down"
      itad: "ok" | "partial" | "down"
      hltb: "ok" | "partial" | "down"
    }
  }
}
```

---

### CacheEntry（キャッシュモデル） `[SEC-MODEL-CACHE]`

```
CacheEntry {
  key: string                 // "itad:price:440"
  data: Game | partial
  fetchedAt: number
  ttlMs: number
  source: string              // "steam" | "itad" | "hltb"
}
```

cache-managerの戻り値:

```
CacheResult {
  data: Game | null
  stale: boolean
  error: AppError | null
}
```

---

### TagProfile（タグプロファイルモデル） `[SEC-MODEL-TAG]`

```
TagProfile {
  weights: {
    [tagName: string]: number     // -1.0 〜 1.0
  }
  source: {
    [tagName: string]: "auto" | "manual" | "feedback"
  }
  lastUpdated: number
}

TagRarity {
  [tagName: string]: number       // 0.0（全ゲームが持つ）〜 1.0（1本しか持たない）
}
```

---

### BacklogEntry（積みゲー分析モデル） `[SEC-MODEL-BACKLOG]`

```
BacklogEntry {
  game: Game
  status: string                  // "untouched" | "tasted" | "abandoned_early" | "abandoned_mid" | "completed" | "unknown"
  completionRate: number | null   // 0.0〜1.0
  dormantDays: number | null
  estimatedRemaining: number | null  // 残りプレイ時間（分）
  wastedSpend: number | null
  rescuePriority: number
}
```

**ステータス分類基準:**

| ステータス | 条件 |
|-----------|------|
| untouched | プレイ時間 0分 |
| tasted | 1〜30分 |
| abandoned_early | 30分〜 HLTB 20%未満 |
| abandoned_mid | HLTB 20%〜70% |
| completed | HLTB 70%以上 |
| unknown | HLTBデータなし（マルチプレイ専用等） |

閾値はユーザー設定で変更可能。

---

### SalePrediction（セール予測モデル） `[SEC-MODEL-SALE]`

```
SalePrediction {
  gameId: string
  nextLikelyMonth: string | null      // "2026-07"
  estimatedDiscount: {
    min: number | null
    max: number | null
  } | null
  confidence: "high" | "medium" | "low" | "insufficient"
  basedOn: PredictionBasis
}

PredictionBasis {
  totalSaleCount: number
  averageCycleDays: number | null
  lastSaleDate: Date | null
  seasonalMonths: number[]            // セールが集中する月（1-12）
  anniversaryMonth: number | null     // 周年月（実績ありの場合のみ）
}
```

**確度判定基準:**

| 確度 | 条件 |
|------|------|
| high | セール実績5回以上、周期の分散が小さい |
| medium | セール実績3〜4回、または周期にばらつきがある |
| low | セール実績2回、パターンが不明瞭 |
| insufficient | セール実績1回以下、予測不能 |

**予測粒度は1ヶ月単位。** 大型セール（サマーセール等）のイベントカレンダーは持たない。ゲーム固有のセールパターンのみで予測する。

**予測シグナル:**
- ITADの価格履歴からのセール周期分析
- 季節パターン（過去のセール実施月の集中度）
- 割引率の深化傾向
- リリース周年（過去に周年セール実績がある場合のみ）

---

### WatchlistFolder / WatchlistEntry（ウォッチリストモデル） `[SEC-MODEL-WATCH]`

```
WatchlistFolder {
  id: string
  name: string
  sortOrder: number
  color: string | null
}

WatchlistEntry {
  game: Game
  folderId: string
  addedAt: number
  addedFrom: string               // "recommend" | "import" | "manual"
  notifyOnSale: boolean
  targetPrice: number | null      // この価格以下で通知
  notes: string
  sortOrder: number
}
```

**デフォルトフォルダ:**
- 「次に買う」
- 「気になる」
- 「様子見」
- 「未分類」（レコメンドからの追加先）

ユーザーによるリネーム・追加・削除自由。

---

### PlaySession / ActivityLog（アクティビティモデル） `[SEC-MODEL-ACTIVITY]`

```
PlaySession {
  gameId: string
  startedAt: number
  endedAt: number | null
  durationMinutes: number
  detectedBy: string              // "process" | "steam_api"
}

ActivityLog {
  sessions: PlaySession[]
  monthlySummary: {
    [month: string]: {            // "2026-02"
      totalMinutes: number
      sessionCount: number
      games: {
        gameId: string
        minutes: number
        sessionCount: number
      }[]
      mostPlayed: string
    }
  }
}
```

四半期別・年別サマリーは `activity-analyzer.js` が `monthlySummary` から動的に生成。別途永続化しない。

---

## ■ キャッシュ戦略 `[SEC-CACHE]`

### データ種別ごとのTTL

| データ種別 | TTL | 理由 |
|-----------|-----|------|
| ゲームタイトル、タグ、ジャンル、ストアURL | 7〜30日 | ほぼ不変 |
| HLTBクリア時間 | 7〜30日 | 変化が少なく、取得コストが高い |
| 現在価格、割引率、セール状態 | 6〜24時間 | 中頻度で変化 |
| ウォッチリスト候補の価格 | 6〜24時間 | 同上 |
| プレイ時間（API経由） | 30分〜2時間 | 高頻度で変化するが分析用途にはリアルタイム不要 |
| レコメンド候補プール | 12〜24時間 | 毎回APIを叩く必要なし |
| 類似ゲーム候補プール | 12〜24時間 | キーは `similar:{appId}` で通常レコメンドと分離 |

TTL値はハードコードせず、設定ファイルまたは electron-store の config セクションに外部化。

### 更新戦略

| 戦略 | 用途 |
|------|------|
| Stale-While-Revalidate | 起動時。キャッシュから即座に表示し、バックグラウンドでAPI更新 |
| ポーリング | セール通知用。6〜12時間間隔でバックグラウンド再取得 |
| 手動リフレッシュ | 各画面の更新ボタン。キャッシュを無視してAPI取得 |

### ストレージ分割

キャッシュ用の electron-store インスタンスをデータ種別ごとに分割:
- `cache-library.json`
- `cache-prices.json`
- `cache-hltb.json`

ユーザーデータ（ウォッチリスト、タグプロファイル、設定等）とは別インスタンスで管理。キャッシュは破損時に「消して再取得」で割り切る。

### オフライン対応

- キャッシュがあればTTL切れでもそのまま表示
- UIに「オフラインデータ（○時間前）」バッジを表示
- キャッシュがなければ「データなし」と表示
- 復帰時の自動再取得はユーザー設定

### aggregator との連携

ソースAはキャッシュから取れたがソースBはAPI待ち、という非同期の部分到着に対応。到着したソースから順次マージして部分的なGameオブジェクトを返し、残りが届いたら更新イベントを発火する。

---

## ■ エラーハンドリング `[SEC-ERROR]`

### リトライ戦略

リトライはcache-manager層で制御。

| ケース | 戦略 |
|--------|------|
| ネットワーク一時障害（staleキャッシュなし） | 最大3回、指数バックオフ（1秒→2秒→4秒） |
| レートリミット | `retryAfterMs` に従い遅延リトライ。staleキャッシュがあれば即返し |
| 認証失敗 | リトライしない。設定画面への誘導 |
| パースエラー | リトライしない。ログ記録 |
| セール通知ポーリング | リトライ1回。次のポーリング周期で再取得 |
| 起動時ライブラリ取得 | リトライ3回。アプリの根幹機能 |

### UI表示パターン（5段階）

| レベル | 状態 | UI対応 |
|--------|------|--------|
| 1. 透過的回復 | リトライ成功 | ユーザーは何も気づかない |
| 2. バッジ表示 | staleデータで表示中 | 「最終更新: ○時間前」バッジ |
| 3. 部分エラー | 特定ソースのみ失敗 | 該当セクションにエラー表示＋リトライボタン |
| 4. ページレベルエラー | 主要データ取得失敗 | 全面エラー表示＋リトライボタン＋キャッシュフォールバック |
| 5. アプリレベルエラー | 認証失敗・store破損等 | 設定画面への誘導、キャッシュクリア提案 |

レベル3（部分エラー）が最も頻繁に発生する。3つのAPIのうち1つが落ちていてもアプリが普通に使える設計。

### ソースステータスインジケーター

画面隅にソースごとの健全性を表示:

```
Steam: 🟢  ITAD: 🟡  HLTB: 🔴
```

`FetchResult.summary.sourceStatus` に基づく。

### electron-store 破損対策

- 読み込み時のtry-catch
- パース失敗時はバックアップから復旧、またはキャッシュは初期状態にリセット
- ユーザー設定（タグ重み付け等）は定期バックアップの対象

### ログ設計

- すべての `AppError` をログに記録
- API呼び出しの成功/失敗、レスポンスタイム、キャッシュヒット率を記録
- `correlationId` でUIに表示されたエラーとログを紐付け
- `electron-log` を採用

---

## ■ 画面構成（タブ）

### 1. ストア / レコメンド（統合タブ） `[SEC-TAB-STORE]`

モード切り替え式の統合タブ。WebViewという共通基盤の上にモードで機能を切り替える。

#### ストアモード

- **WebViewの挙動:** 自由ブラウジング。Steamストアドメイン内のリンク遷移を許可
- **上部:** 戻る・進む・ホームボタン、ページタイトル表示
- **下部（コンテキスト価格バー）:** WebViewのURLが `store.steampowered.com/app/{appId}` にマッチしたときのみ自動表示

```
現在価格: ¥3,980    現在最安: ¥2,480 (GMG) ↗    史上最安: ¥1,980 ↗    次回予測: 7月頃 (40〜50%オフ)
[ ウォッチリストに追加 ]  [ 似たゲームを探す ]
```

- 「現在最安」「史上最安」はITADページへの外部リンク（`shell.openExternal` で既定ブラウザで開く）
- 外部リンクは↗アイコン＋ツールチップ「IsThereAnyDealで詳細を見る（ブラウザで開きます）」で明示
- 「似たゲームを探す」ボタンで類似検索モードに遷移
- ゲームページ以外（トップ、検索結果等）では価格バー非表示
- appIdの検出はURLパターンマッチのみ（WebViewのDOM解析はしない）

#### レコメンドモード

- **WebViewの挙動:** 候補ゲームのストアページに固定。ストア内リンク遷移をブロック
- **上部:** モード表示＋フィルタ＋プログレス

```
通常時:    🎯 あなたの嗜好に基づくレコメンド    [ 発売中のみ | 未発売・TBDのみ | すべて ]    12 / 48    [← 前へ]
類似検索時: 🔍 「Hades」に似たゲームを検索中    [ 発売中のみ | 未発売・TBDのみ | すべて ]    [× 通常レコメンドに戻る]
```

- マッチ度スコアをホバー/クリックでタグ内訳展開
- フィルタのデフォルトは「発売中のみ」
- フィルタは候補プール内をクライアントサイドでフィルタリング（プール自体は全状態を含む）

- **下部（価格バー＋アクションバー）:**

```
発売中:   現在価格: ¥3,980    現在最安: ¥2,480 (GMG) ↗    史上最安: ¥1,980 ↗    次回予測: 7月頃 (40〜50%オフ)
未発売:   予定価格: ¥5,980    発売日: 2026年7月15日    セール予測: 発売後のデータ蓄積が必要です
TBD:     予定価格: 未定      発売日: 未定

[ ウォッチリストに追加 ]  [ 興味あり → ]  [ スキップ → ]
```

- キーボードショートカット: `W` ウォッチリスト追加、`→` 興味あり、`←` スキップ、`↑` 前の候補
- カードのプリロード: 次の2〜3枚分のヘッダー画像を先読み

#### セール予測の展開パネル

価格バーの次回予測をクリックで展開:

```
📊 セール予測の根拠

過去のセール回数: 8回
平均セール周期: 約52日
前回セール: 2026年5月10日（45%オフ）
セールが多い月: 6月, 10月, 12月
割引率の傾向: 30% → 40% → 45%（徐々に深化）

→ 7月頃に40〜50%オフの可能性（確度: 高）
```

#### モード間の状態保持

- レコメンドモードの状態（候補インデックス、フィードバック履歴、候補プール）はモード切替で保持
- ストアモードの状態（WebView閲覧履歴）もモード切替で保持
- 「ストアモードで開く」ボタンでリンク遷移自由な状態で同じゲームを閲覧可能

#### 類似ゲーム検索 `[SEC-SIMILAR]`

- **起点:** ストアモードの「似たゲームを探す」ボタン、統計タブのライブラリ一覧からのコンテキストメニュー（この2箇所のみ）
- 起点は所持・未所持を問わない。未所持ゲームの場合はSteam Store APIでタグを取得し一時Gameオブジェクトを構築
- 結果はレコメンドモード（類似検索モード）で表示
- スコアリングはタグ特異性（TF-IDF）ベース。汎用タグ（Singleplayer等）の一致は重みが低く、具体的なタグ（Roguelike Deckbuilder等）の一致は重みが高い

---

### 2. ウォッチリスト `[SEC-TAB-WATCH]`

Steamのウィッシュリストとは完全に独立したアプリ内管理リスト。

- **左サイドバー:** フォルダ一覧（ドラッグ＆ドロップで並べ替え可能、各フォルダにエントリ数表示、最下部に「＋フォルダ追加」ボタン）
- **右メイン領域:** 選択中フォルダ内のゲームをカード形式またはコンパクトリスト形式で表示
- 各エントリに価格バー（現在価格/現在最安/史上最安＋セール予測）、目標価格、追加日、ユーザーメモ、購入タイミングバッジを表示
- エントリのドラッグ＆ドロップでフォルダ間移動、フォルダ内並べ替え対応
- 複数選択してまとめてフォルダ移動可能
- カード表示/コンパクトリスト表示のトグル
- 「全フォルダ横断」ビュー（ソート条件切替: 価格順、追加日順、セール率順、フォルダ別）
- 「今セール中のもの」フィルタ

**購入タイミングアドバイザーバッジ:**

| バッジ | 条件 |
|--------|------|
| 🟢 買い時 | 現在価格が史上最安の110%以内 |
| 🟡 もう少し待てそう | セール予測が1ヶ月以内で確度が高い |
| 🔴 今は高い | 上記に該当しない |

バッジクリックで判断根拠を表示。

**Steamウィッシュリストからのインポート:**
- 初回セットアップ時と設定画面から実行可能
- 一方通行でアプリ内に取り込み、以降はSteam側と無関係に運用
- 重複スキップ、新規分は「未分類」フォルダに追加、`addedFrom: "import"` でマーク

**セール通知連携:**
- フォルダ単位でデフォルト通知ON/OFF設定可能
- 個別エントリで上書き可能
- 通知に「フォルダ: 次に買う」と表示

---

### 3. 統計 `[SEC-TAB-STATS]`

- プレイ時間ランキング
- タグ分布可視化
- 支出分析（月別・年別購入金額推移、セール購入 vs フルプライス比率）
- DLCは支出分析にのみ含める
- コスパランキング（`basePrice / playtimeMinutes` で1時間あたり費用を算出）
- ライブラリ一覧（各ゲームに「似たゲームを探す」コンテキストメニュー）
- アクティビティログ表示:
  - カレンダーヒートマップ（GitHubコントリビューショングラフ形式、日単位）
  - 月別/四半期別/年別サマリー
  - ゲーム別セッション履歴
  - プレイパターン分析（曜日別・時間帯別の傾向）

---

### 4. 積みゲー `[SEC-TAB-BACKLOG]`

**サマリーセクション（上部）:**
総所持数 / 積みゲー数 / 未起動数 / 積みゲー総額 / 全部クリアするのにかかる推定時間

**ステータス分布チャート（左）:**
5段階分類のドーナツチャート。各セグメントクリックでフィルタリング。

**放置期間ヒストグラム（右）:**
X軸: 放置期間（1ヶ月未満/1〜3ヶ月/3〜6ヶ月/6ヶ月〜1年/1年以上）、Y軸: ゲーム数

**タグ別積み傾向（中段）:**
横棒グラフで「タグごとの所持数 vs 積みゲー数」。積み率が高いタグ＝買うけど遊ばないジャンル。

**救出リスト（下段）:**
`rescuePriority` 順にゲームを表示。ゲーム名、ステータスバッジ、残り推定時間、購入価格、タグスコア。
フィルタ（残り時間○時間以内、特定タグ等）。
「スコア順（自動）」と「カスタム順（手動）」のトグル。カスタム順はドラッグ＆ドロップで並べ替え、両方の順序を保持。

**救出優先度スコアの考慮要素:**
- 残り時間の短さ（あと少しでクリアできるゲームを優先）
- レビュー評価（高評価を優先）
- タグの嗜好マッチ（scorer.jsのタグスコア活用）
- 購入価格（高額ゲームの「もったいない」度）
- 放置期間の長さ（重みはユーザー設定で調整可能）

**エッジケース対応:**
- F2Pタイトル: wastedSpend計算から除外。積みゲーカウント対象にするかはユーザー設定（デフォルトOFF）
- マルチプレイ専用: ステータス "unknown"、積みゲー集計から除外（タグ "Multiplayer" で自動判別）
- プレイ時間異常値: HLTBメイン時間の5倍超にフラグ

---

### 5. 設定 `[SEC-TAB-SETTINGS]`

**タグプロファイル調整:**
- 上位タグのスライダー一覧（-1.0〜1.0）
- 自動算出値をデフォルト表示、ユーザー上書きは `source: "manual"` でマーク
- 「プロファイルをリセット」ボタン

**通知設定:**
- セール通知の有効/無効
- 通知閾値（○%オフ以上で通知）
- 過去最安値更新時に通知
- 積みゲー連携の有効/無効（デフォルトOFF）
- 発売日確定時に通知（ウォッチリスト内未発売ゲーム用）
- 発売日当日に通知
- ポーリング間隔（6時間/12時間/24時間）

**除外設定:**
- ゲームごとの2種類の除外:
  - 「分析から除外」— 積みゲー分析・統計から除外（プレイ時間が不正確なゲーム用）
  - 「興味なし」— レコメンド候補から永久除外
- 除外済みゲームの一覧表示と解除機能

**アクティビティログ設定:**
- プロセス監視のON/OFF（デフォルトOFF）
- スキャン間隔（30秒/60秒）
- プライバシー説明文の表示

**レコメンド設定:**
- スコアリング重み調整（価格効率の重視度等）
- レビュー信頼度補正のON/OFF

**データ管理:**
- Steamウィッシュリストからのインポート
- データエクスポート（JSON/CSV）
- キャッシュクリア
- APIキー管理

**キャッシュ設定:**
- データ種別ごとのTTL調整
- ポーリング頻度の変更

**積みゲー設定:**
- ステータス分類の閾値調整
- F2Pの積みゲーカウント対象ON/OFF

---

## ■ アクティビティログ（プロセス監視） `[SEC-ACTIVITY]`

### 検知の仕組み

Discordのアクティビティ検知と同じアプローチ。OSのプロセスリストを定期スキャンし、Steamゲームのプロセスを検出する。

**ゲームプロセスの特定方法:**
1. `steamapps/common/{ゲーム名}/` 配下の実行パスパターンでマッチ
2. `appmanifest_{appId}.acf` ファイルからフォルダ名→appIdのマッピングテーブルを構築
3. フォールバック: Steam APIの「現在プレイ中」情報を補助的に使用

```
ProcessMapping {
  installDir: string         // "Hades II"
  appId: string              // "1145350"
  executablePaths: string[]
}
```

### 検知フロー

| イベント | 処理 |
|---------|------|
| 起動検知 | 前回スキャンになかったプロセスが出現→ PlaySession開始 |
| 継続確認 | プロセス存在を確認、何もしない |
| 終了検知 | プロセス消失→ endedAt記録、セッション確定、永続化 |
| 異常終了対策 | endedAtがnullの未完了セッション→次回起動時に最終スキャン時刻で補完 |

### プライバシー

- Steamゲーム以外のプロセス情報は一切記録せず即座に破棄
- ログに残すのは appId、開始時刻、終了時刻のみ
- 機能自体がデフォルトOFF、初回起動時に説明付きで有効化を提案

---

## ■ レコメンドエンジン詳細 `[SEC-RECOMMEND]`

### タグプロファイルの自動算出

ライブラリ内の各ゲームのプレイ時間をそのゲームのタグに按分。全タグの最大値で正規化して0〜1の範囲に。プレイ時間0のゲーム（積みゲー）のタグは加算しない。

### フィードバック学習

- レコメンドモードでの「興味あり」→ 該当タグの重みを +0.05
- 「スキップ」→ 該当タグの重みを -0.05
- `source: "feedback"` でマーク
- 手動調整とは別管理、次回自動再計算時にmanualのタグは上書きしない

### 通常レコメンドのスコアリング

scorer.js のメソッド:

- `calculateTagProfile(games: Game[]): TagProfile`
- `scoreCandidate(candidate: Game, profile: TagProfile, settings: ScoringSettings): number`
- `rankCandidates(candidates: Game[], profile: TagProfile, settings: ScoringSettings): RankedGame[]`

**スコア要素:**

| 要素 | 重み | 備考 |
|------|------|------|
| タグマッチスコア | 最大 | プロファイルとの一致度 |
| レビュー評価 | 中 | ウィルソンスコア区間で信頼度補正 |
| 価格効率 | 低〜中（設定可能） | 現在価格 / HLTBクリア時間 |
| 新鮮さ | 低 | リリース日が新しいゲームに軽いボーナス |
| ネガティブ要素 | — | スキップ済みゲームのスコアを大幅ダウン（永久除外にはしない） |

### 類似ゲーム検索のスコアリング

scorer.js の追加メソッド:

- `scoreSimilarCandidate(candidate: Game, sourceGame: Game, tagRarity: TagRarity, settings: ScoringSettings): number`

**スコア要素:**

| 要素 | 重み | 備考 |
|------|------|------|
| タグ類似度（TF-IDF） | 最大 | 特異性の高いタグの一致を重視 |
| レビュー評価 | 中 | 通常レコメンドと共通 |
| 価格帯の近さ | 低（オプション） | 設定でON/OFF |

tag-manager.js の追加メソッド:
- `calculateTagRarity(games: Game[]): TagRarity`

### 候補の除外条件（共通）

- ユーザー所持済みゲーム
- 起点ゲーム自体（類似検索時）
- ウォッチリストで「興味なし」マークしたゲーム
- 過去にスキップしたゲーム（完全除外ではなく優先度大幅ダウン）
- DLC

### 発売状態フィルタ

| フィルタ | 対象 |
|---------|------|
| 発売中のみ | `releaseStatus: "released"` |
| 未発売・TBDのみ | `releaseStatus: "upcoming"` または `"tbd"` |
| すべて | フィルタなし |

---

## ■ 外部リンクの方針 `[SEC-EXTLINK]`

WebView内には外部サイトを表示しない。すべての外部リンクは `shell.openExternal` で既定ブラウザに飛ばす。

| リンク | 飛び先 |
|--------|--------|
| 現在最安 | ITADのゲームページ |
| 史上最安 | ITADのゲームページ |
| 将来追加（SteamDB, ProtonDB等） | 各サイトのゲームページ |

---

## ■ API構成 `[SEC-API]`

### Steam

- 所持ゲーム取得
- ストア詳細取得（タグ、ジャンル、レビュー、リリース日、アプリタイプ）
- ウィッシュリスト取得（インポート用）
- タグ検索（レコメンド候補プール取得）

### IsThereAnyDeal

- 現在価格（全ストア横断）
- セール履歴
- 最安値（歴代）
- ゲームページURL

### HowLongToBeat

- 平均クリア時間

---

## ■ 拡張性設計 `[SEC-EXTEND]`

新サービス追加時:
1. apiフォルダにadapter追加
2. 共通Gameモデルへ変換
3. aggregatorで統合

他層は変更不要。

---

## ■ テスト戦略 `[SEC-TEST]`

### RED-GREEN-REFACTORサイクルの強制

本プロジェクトはTDD（テスト駆動開発）のRED-GREEN-REFACTORサイクルを必須とする。
Claudeへの実装依頼時もこのサイクルに従うこと。テストなしのコード追加・変更は認めない。

**サイクルの定義:**

```
1. RED    — まず失敗するテストを書く。実装はまだ存在しない（またはテストが通らない状態）
2. GREEN  — テストを通す最小限の実装を書く。過剰な設計・最適化はしない
3. REFACTOR — テストが通ったまま、コードの品質を改善する。重複排除、命名改善、構造整理
```

**運用ルール:**

- 新しい関数・メソッドを追加するとき → 必ずREDから始める
- 既存関数の振る舞いを変更するとき → まず変更後の期待を反映したテストを書いてRED → 実装変更でGREEN
- バグ修正のとき → まずバグを再現するテストを書いてRED → 修正でGREEN
- REFACTORフェーズでは外部から観測可能な振る舞いを変えない（テストが全てパスし続けること）

**Claudeへの実装依頼時のフォーマット:**

```
【フェーズ】RED / GREEN / REFACTOR
【対象モジュール】例: engine/scorer.js
【内容】
  RED:      scoreCandidate が reviewScore null のとき reviewScore を無視してスコア計算するテストを追加
  GREEN:    scoreCandidate に null チェックを追加
  REFACTOR: スコア計算の共通部分を _calculateBaseScore に切り出し
```

1回の依頼で複数フェーズを含めてもよいが、各フェーズの境界を明示すること。
「テストなしで実装だけ書いて」という依頼は、Claudeはテスト追加を提案したうえで進めること。

**テストファイルの配置:**

```
tests/
  engine/
    scorer.test.js
    tag-manager.test.js
    sale-predictor.test.js
    backlog-analyzer.test.js
    aggregator.test.js
    activity-analyzer.test.js
    purchase-advisor.test.js
    cost-analyzer.test.js
  api/
    steam.test.js          // モック使用
    itad.test.js           // モック使用
    hltb.test.js           // モック使用
  main/
    cache-manager.test.js
    activity-monitor.test.js
```

api層のテストは外部APIをモックに差し替えて実行する。engine層のテストはモック不要（純ロジックのため）。

### テスト対象モジュール

engine層は純ロジックなのでユニットテストが書きやすい。以下を最低限のテスト対象とする。

| モジュール | テスト観点 |
|-----------|-----------|
| `scorer.js` | タグマッチスコア計算、類似ゲームスコア計算、プロファイル算出 |
| `aggregator.js` | 複数ソースのマージ、競合時の優先ルール、null埋め |
| `backlog-analyzer.js` | ステータス分類、救出優先度スコア、サマリー集計 |
| `sale-predictor.js` | 周期分析、割引率傾向、確度判定 |
| `tag-manager.js` | タグ集計、特異性スコア |
| `activity-analyzer.js` | 月別/四半期別/年別集計 |
| `purchase-advisor.js` | 購入タイミング判定 |
| `cost-analyzer.js` | コスパ計算 |

### テストカバレッジ方針

- engine層: 全公開関数に対してテスト必須。分岐カバレッジ80%以上を目標
- api層: 正常レスポンス・エラーレスポンス・タイムアウトの3パターンを最低限カバー
- main層: cache-manager のTTL判定・リトライロジックをカバー
- renderer層: ユニットテスト対象外（E2Eテストで将来的にカバー）

---

## ■ トークン削減運用ルール（開発方針） `[SEC-TOKEN]`

- 修正依頼はファイル単位ではなく関数単位
- 全文貼らず差分指定
- API仕様は別固定メモ参照
- 設計セッションと実装セッションを分離
- **実装依頼は必ずRED-GREEN-REFACTORのフェーズを明示する（SEC-TEST参照）**
- テストコードと実装コードは同一の依頼内でフェーズを分けて記述する

---

## ■ セッション管理・作業再開プロトコル `[SEC-SESSION]`

本プロジェクトはClaudeによるGitHub上での開発を前提とする。
トークン上限到達時やセッション切断時に、次のセッションで作業をスムーズに再開できるよう、以下のプロトコルを必須とする。

### 進捗管理ファイル: `PROGRESS.md`

リポジトリルートに `PROGRESS.md` を配置し、Claudeは作業のたびにこのファイルを更新する。
**新しいセッションの開始時、Claudeはまずこのファイルを読むこと。**

```markdown
# Steam Analyzer 開発進捗

## 現在のフェーズ
<!-- "設計" | "実装" | "テスト" | "リファクタリング" | "バグ修正" -->
実装

## 現在のタスク
<!-- 今取り組んでいるタスクの概要 -->
engine/scorer.js の scoreCandidate 実装

## TDDフェーズ
<!-- "RED" | "GREEN" | "REFACTOR" | "完了" -->
GREEN（テストは書いた。実装を書いている途中）

## 直前にやったこと
- scorer.test.js に scoreCandidate の基本テスト5件を追加（RED完了）
- scoreCandidate の骨格を実装中、タグマッチスコアの計算まで完了

## 次にやるべきこと
1. scoreCandidate のレビュー評価スコア部分を実装
2. scoreCandidate の価格効率スコア部分を実装
3. 全テストがパスすることを確認（GREEN完了）
4. スコア計算の共通部分を切り出すリファクタリング

## 未解決の問題・判断待ち
- なし

## 完了済みモジュール一覧
<!-- チェックボックスで管理 -->
### engine層
- [ ] scorer.js
- [ ] tag-manager.js
- [ ] sale-predictor.js
- [ ] backlog-analyzer.js
- [ ] aggregator.js
- [ ] activity-analyzer.js
- [ ] cost-analyzer.js
- [ ] purchase-advisor.js

### api層
- [ ] steam.js
- [ ] itad.js
- [ ] hltb.js

### main層
- [ ] cache-manager.js
- [ ] activity-monitor.js
- [ ] store.js
- [ ] ipc-handlers.js
- [ ] notifier.js
- [ ] tray.js

### renderer層
- [ ] tabs/store-recommend.js
- [ ] tabs/watchlist.js
- [ ] tabs/statistics.js
- [ ] tabs/backlog.js
- [ ] tabs/settings.js
- [ ] components/price-bar.js
- [ ] components/game-card.js

### テスト
- [ ] tests/engine/scorer.test.js
- [ ] tests/engine/tag-manager.test.js
- [ ] tests/engine/sale-predictor.test.js
- [ ] tests/engine/backlog-analyzer.test.js
- [ ] tests/engine/aggregator.test.js
- [ ] tests/engine/activity-analyzer.test.js
- [ ] tests/engine/purchase-advisor.test.js
- [ ] tests/engine/cost-analyzer.test.js
- [ ] tests/api/steam.test.js
- [ ] tests/api/itad.test.js
- [ ] tests/api/hltb.test.js
- [ ] tests/main/cache-manager.test.js
- [ ] tests/main/activity-monitor.test.js
```

### セッション終了時のルール

Claudeはトークン上限が近づいたと判断した場合、または作業の区切りでセッションを終了する場合、以下を必ず実行すること。

1. **現在の作業を安全な状態にする**
   - テストがパスする状態でコミットする（REDフェーズの途中でも、テストファイルだけはコミット可）
   - 実装が中途半端な状態でのコミットは避ける。やむを得ない場合はコメントで `// TODO: [SESSION-BREAK] ここから再開` を残す

2. **PROGRESS.md を更新する**
   - 「直前にやったこと」「次にやるべきこと」「TDDフェーズ」を正確に記述
   - 未解決の問題・設計判断があれば記録

3. **コミットメッセージに状態を記録する**
   ```
   [SESSION-END] scorer.js GREEN途中 - タグマッチスコアまで実装済み
   
   完了: scorer.test.js 基本テスト5件
   途中: scoreCandidate のタグマッチスコア計算まで
   次回: レビュー評価スコア、価格効率スコアの実装
   ```

### セッション開始時のルール

新しいセッションでClaudeが作業を再開する際、以下の順序で状況を把握すること。

```
1. PROGRESS.md を読む
2. 直近のコミットログを確認する（git log --oneline -10）
3. テストを実行して現在の状態を確認する（npm test）
4. 「次にやるべきこと」の最初の項目から作業を再開する
```

**セッション開始時にユーザーに確認すべきこと:**
- PROGRESS.md の「次にやるべきこと」に変更はあるか
- 「未解決の問題・判断待ち」への回答はあるか
- 優先度の変更はあるか

### `// TODO: [SESSION-BREAK]` マーカー

実装が中途半端な状態で中断せざるを得ない場合、コード中にマーカーを残す。

```javascript
// TODO: [SESSION-BREAK] ここから再開
// 残り: レビュー評価のウィルソンスコア区間計算を実装する
// 参照: SEC-RECOMMEND のスコア要素テーブル
```

次のセッションで `grep -r "SESSION-BREAK"` を実行すれば、中断箇所が即座に特定できる。再開後、実装が完了したらマーカーを削除する。

### ブランチ戦略

モジュール単位でブランチを切り、完成後にmainにマージする。

```
main
├── feature/engine-scorer
├── feature/engine-tag-manager
├── feature/engine-sale-predictor
├── feature/api-steam
├── feature/api-itad
├── feature/main-cache-manager
├── feature/renderer-store-recommend
└── ...
```

1つのブランチが1つのモジュール（+対応するテスト）に対応する。ブランチ内の全テストがパスした状態でのみマージを許可。これにより、セッション中断でブランチが中途半端でもmainは常に安全な状態を保てる。

### 実装順序ガイドライン `[SEC-IMPL-ORDER]`

依存関係を考慮した推奨実装順序。Claudeが「次に何を実装すべきか」迷ったときはこの順序に従う。

```
フェーズ1: 基盤（依存なし）
  1. engine/tag-manager.js        ← 他のengineモジュールが依存
  2. engine/aggregator.js         ← データ統合の基盤
  3. main/store.js                ← 永続化の基盤

フェーズ2: API層（tag-manager, aggregator に依存）
  4. api/steam.js                 ← メインデータソース
  5. api/itad.js                  ← 価格情報
  6. api/hltb.js                  ← クリア時間

フェーズ3: キャッシュ・エラー基盤（API層に依存）
  7. main/cache-manager.js        ← API層をラップ

フェーズ4: 分析エンジン（engine層、キャッシュに依存）
  8. engine/scorer.js             ← レコメンドの中核
  9. engine/sale-predictor.js     ← セール予測
  10. engine/backlog-analyzer.js  ← 積みゲー分析
  11. engine/cost-analyzer.js     ← コスパ分析
  12. engine/purchase-advisor.js  ← 購入タイミング

フェーズ5: IPC・通知（main層）
  13. main/ipc-handlers.js        ← renderer↔engine の橋渡し
  14. main/notifier.js            ← 通知
  15. main/tray.js                ← トレイ常駐

フェーズ6: UI（renderer層、IPC経由でengineを利用）
  16. components/price-bar.js     ← 共通コンポーネント
  17. components/game-card.js     ← 共通コンポーネント
  18. tabs/store-recommend.js     ← メイン機能
  19. tabs/watchlist.js
  20. tabs/statistics.js
  21. tabs/backlog.js
  22. tabs/settings.js

フェーズ7: アクティビティログ（独立性が高い）
  23. main/activity-monitor.js
  24. engine/activity-analyzer.js
```

各フェーズ内の順序は上から順が推奨だが、厳密ではない。
フェーズをまたいだ前後は依存関係に注意すること。

### 仕様書の参照方法

Claudeが実装中に仕様を確認する際のクイックリファレンス。

| 知りたいこと | 参照先 |
|-------------|--------|
| あるモジュールの責務は？ | SEC-LAYERS |
| データモデルのフィールドは？ | SEC-MODEL-xxx |
| UIの表示仕様は？ | SEC-TAB-xxx |
| スコアリングのロジックは？ | SEC-RECOMMEND / SEC-SIMILAR |
| エラー時の振る舞いは？ | SEC-ERROR |
| キャッシュのTTLは？ | SEC-CACHE |
| テストの書き方は？ | SEC-TEST |
| 次に何を実装すべき？ | SEC-IMPL-ORDER（本セクション）または PROGRESS.md |

---

## ■ 将来想定拡張 `[SEC-FUTURE]`

- 他価格サイト追加（すべてapi層追加で対応）
- タグ自動学習の高度化
- 通知条件の細分化
- フレンドライブラリ比較（フレンドが遊んでいて自分が持っていないゲームのレコメンド）
- DLC/続編リリースに伴うセール予測
- リモートイベントカレンダー配信
