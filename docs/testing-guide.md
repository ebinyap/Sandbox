# Steam Analyzer テストガイド

このドキュメントは、Steam Analyzer プロジェクトのテストを自分の環境で実行するための手順書です。
テスト項目の一覧、実行方法、よくあるトラブルと対処法をまとめています。

---

## 目次

1. [環境構築](#1-環境構築)
2. [テスト実行コマンド一覧](#2-テスト実行コマンド一覧)
3. [テスト項目チェックリスト](#3-テスト項目チェックリスト)
   - [3.1 engine層（ユニットテスト）](#31-engine層ユニットテスト)
   - [3.2 API層（ユニットテスト）](#32-api層ユニットテスト)
   - [3.3 main層（ユニットテスト）](#33-main層ユニットテスト)
   - [3.4 renderer層（コンポーネントテスト）](#34-renderer層コンポーネントテスト)
   - [3.5 統合テスト](#35-統合テスト)
   - [3.6 E2Eテスト](#36-e2eテスト)
4. [トラブルシューティング](#4-トラブルシューティング)

---

## 1. 環境構築

### 前提条件

| 項目 | 要件 |
|------|------|
| Node.js | v18 以上（推奨: v20+） |
| npm | Node.js に同梱 |
| OS | Windows / macOS / Linux |
| ディスプレイ | E2Eテスト実行時に必要（Linux ヘッドレス環境では xvfb が必要） |

### セットアップ手順

```bash
# 1. リポジトリをクローン
git clone <repo-url>
cd steam-analyzer

# 2. 依存関係をインストール
npm install

# 3. ユニット＋統合テストを実行（E2E除く）
npm test

# 4. E2Eテストを実行（Electron が起動する）
npm run test:e2e
```

`npm install` が完了すれば、すぐに `npm test` を実行できます。

---

## 2. テスト実行コマンド一覧

### 基本コマンド

| コマンド | 用途 | 対象 |
|---------|------|------|
| `npm test` | 全 Jest テスト実行 | ユニット + 統合（183テスト） |
| `npm run test:watch` | ファイル変更時に自動再実行 | 開発中の利用向け |
| `npm run test:coverage` | カバレッジレポート付き実行 | CI / レビュー時 |
| `npm run test:e2e` | Playwright E2E テスト | Electron アプリ（24テスト） |

### レイヤー別に絞り込んで実行

```bash
# engine層のみ
npx jest tests/engine/

# API層のみ
npx jest tests/api/

# main層のみ
npx jest tests/main/

# 統合テストのみ
npx jest tests/integration/

# renderer層のみ
npx jest tests/renderer/
```

### 特定ファイル・特定テストの実行

```bash
# ファイル名パターンで絞り込み
npx jest --testPathPattern="scorer"

# テスト名（describe/test の文字列）で絞り込み
npx jest -t "空配列"

# 特定ファイルの watch モード
npx jest --watch tests/engine/scorer.test.js
```

### カバレッジレポートの見方

```bash
npm run test:coverage
```

実行後、以下の場所にレポートが生成されます:
- ターミナル出力: サマリー表示
- `coverage/lcov-report/index.html`: ブラウザで開ける詳細レポート

プロジェクトの目標: engine層の分岐カバレッジ 80% 以上。

### Jest 設定（参考）

`package.json` 内の設定:

```json
{
  "jest": {
    "testMatch": ["**/tests/**/*.test.js"],
    "testPathIgnorePatterns": ["/tests/e2e/"],
    "testEnvironment": "node"
  }
}
```

- `testMatch`: `tests/` 配下の全 `.test.js` ファイルが対象
- `testPathIgnorePatterns`: E2E テストは Jest から除外（Playwright で実行）
- `testEnvironment`: `node`（jsdom ではない）

---

## 3. テスト項目チェックリスト

### テスト全体の構成

| カテゴリ | ファイル数 | テスト数 | モック | 特徴 |
|---------|----------|---------|-------|------|
| engine層 | 8 | 69 | なし | 純ロジック。最も実行が速い |
| API層 | 3 | 20 | `global.fetch` / `howlongtobeat` | 外部API呼び出しをモック |
| main層 | 4 | 59 | `electron` / `electron-store` / `ps-list` | Electron 依存をモック |
| renderer層 | 1 | 14 | なし | `global.window` を手動設定 |
| 統合テスト | 4 | 21 | `electron-store`（一部） | 複数モジュール横断 |
| **小計（Jest）** | **20** | **183** | | |
| E2E | 2 | 24 | なし | 実際の Electron アプリを起動 |
| **合計** | **22** | **207** | | |

---

### 3.1 engine層（ユニットテスト）

純粋なロジックのみ。外部依存がないため、最も安定してパスするテスト群。

#### `tests/engine/scorer.test.js`（14テスト）

レコメンドエンジンのスコアリング処理。

| describe | テスト | 検証内容 |
|----------|-------|---------|
| calculateTagProfile | 空配列は空の weights を返す | 入力なし時のエッジケース |
| | プレイ時間0のゲームのタグは加算しない | ゼロプレイのフィルタリング |
| | プレイ時間に比例してタグの重みが決まる | 正規化された重み計算 |
| | null プレイ時間のゲームは無視する | null 安全性 |
| | source は全て "auto" になる | 自動生成プロファイルのフラグ |
| scoreCandidate | プロファイルと一致するタグが多いほどスコアが高い | タグマッチング精度 |
| | レビュースコアが高いほどスコアにボーナスが付く | レビューボーナス計算 |
| | reviewScore が null でもエラーにならない | null 安全性 |
| | スコアは 0 以上を返す | 非負制約 |
| rankCandidates | スコア降順にソートされる | ソート正確性 |
| | 各要素に game と score が含まれる | 出力構造 |
| | 空配列は空配列を返す | エッジケース |
| scoreSimilarCandidate | タグが一致し rarity が高いほどスコアが高い | 類似検索スコア計算 |
| | rarity が高い共通タグほど重視される | TF-IDF 重み付け |

#### `tests/engine/tag-manager.test.js`（9テスト）

タグの集計・特異性スコア（TF-IDF）の計算。

| describe | テスト | 検証内容 |
|----------|-------|---------|
| aggregateTags | 空配列は空オブジェクトを返す | エッジケース |
| | 1本のゲームのタグをカウントする | 基本カウント |
| | 複数ゲームでタグの出現回数を集計する | クロス集計 |
| | タグが空配列のゲームは無視される | 空タグ処理 |
| calculateTagRarity | 空配列は空オブジェクトを返す | エッジケース |
| | 全ゲームが持つタグの rarity は 0.0 | 共通タグ = 希少性ゼロ |
| | 1本のみが持つタグの rarity は最大値に近い | 希少タグ検出 |
| | ゲームが1本だけの場合、全タグの rarity は 0 | 単一ゲームのエッジケース |
| | rarity は 0.0 から 1.0 の範囲に収まる | 値域の保証 |

#### `tests/engine/aggregator.test.js`（9テスト）

複数データソース（Steam / ITAD / HLTB）からのゲームデータ統合。

| describe | テスト | 検証内容 |
|----------|-------|---------|
| mergeGamePair | 同じ id のゲームをマージする | 基本マージ |
| | null フィールドは他方の値で埋まる | null 穴埋め |
| | 両方が非null の場合、先の値（base）を優先する | 優先順位ルール |
| | sourceFlags はマージされる（重複なし） | フラグ統合 |
| | tags は base の値を使う（マージしない） | タグ保護 |
| mergeGames | 空配列は空配列を返す | エッジケース |
| | ソースが1つなら変換なしで返す | パススルー |
| | 同一 id のゲームをまとめる | バッチマージ |
| | id の順序は最初に出現した順を保持する | 順序安定性 |

#### `tests/engine/backlog-analyzer.test.js`（14テスト）

積みゲー分析（ステータス分類・救出優先度計算）。

| describe | テスト | 検証内容 |
|----------|-------|---------|
| classifyStatus | プレイ時間 0 → untouched | 未プレイ |
| | プレイ時間 null → untouched | null 処理 |
| | プレイ時間 1〜30分 → tasted | 味見 |
| | プレイ時間 30分、HLTB 20%未満 → abandoned_early | 序盤放棄 |
| | プレイ時間 HLTB 20%〜70% → abandoned_mid | 中盤放棄 |
| | プレイ時間 HLTB 70%以上 → completed | クリア済み |
| | HLTB データなし、プレイ時間 > 30分 → unknown | データ不足 |
| calculateRescuePriority | abandoned のゲームは untouched より高い優先度 | 優先度ロジック |
| | 高価なゲームほど優先度が高い | 価格重み付け |
| | completed のゲームは優先度 0 | クリア済み除外 |
| analyzeBacklog | 空配列は空の結果を返す | エッジケース |
| | 各ゲームを BacklogEntry に変換する | 出力構造 |
| | summary にステータスごとの件数が含まれる | サマリー統計 |
| | entries は rescuePriority 降順でソートされる | ソート正確性 |

#### `tests/engine/sale-predictor.test.js`（6テスト）

セール周期分析・次回セール予測。

| describe | テスト | 検証内容 |
|----------|-------|---------|
| predictSale | セール実績5回以上・周期安定 → confidence: high | 高信頼度判定 |
| | セール実績3〜4回 → confidence: medium | 中信頼度判定 |
| | セール実績2回 → confidence: low | 低信頼度判定 |
| | セール実績1回以下 → confidence: insufficient | データ不足判定 |
| | 空のセール履歴 → insufficient | エッジケース |
| | basedOn にセール回数と周期情報が含まれる | 判定根拠の出力 |

#### `tests/engine/cost-analyzer.test.js`（6テスト）

コストパフォーマンス分析。

| describe | テスト | 検証内容 |
|----------|-------|---------|
| calculateCostPerHour | プレイ時間と価格から1時間あたりコストを算出 | 基本計算 |
| | プレイ時間 0 は Infinity を返す | ゼロ除算 |
| | 価格 null は null を返す | null 安全性 |
| | F2P (価格0) は 0 を返す | 無料ゲーム |
| rankByCostEfficiency | コスパが良い順にソートされる | ソート正確性 |
| | 価格不明のゲームは末尾に配置される | null 配置 |

#### `tests/engine/purchase-advisor.test.js`（5テスト）

購入タイミング判定。

| describe | テスト | 検証内容 |
|----------|-------|---------|
| advise | 歴代最安値に近い → "buy_now" | 買い時判定 |
| | セールが近い予測 → "wait" | 待ち推奨 |
| | 現在価格がベース価格に近い → "expensive" | 高値警告 |
| | 価格データ不足 → verdict: "unknown" | データ不足 |
| | 結果に verdict と reasons が含まれる | 出力構造 |

#### `tests/engine/activity-analyzer.test.js`（6テスト）

プレイ時間の月別・四半期別・年別集計。

| describe | テスト | 検証内容 |
|----------|-------|---------|
| buildMonthlySummary | 月別に totalMinutes と sessionCount を集計する | 月別集計 |
| | ゲーム別の内訳が含まれる | ゲーム内訳 |
| | mostPlayed が正しい | 最多プレイ判定 |
| | 空配列は空オブジェクトを返す | エッジケース |
| buildQuarterlySummary | 四半期別に集計する | 四半期集計 |
| buildYearlySummary | 年別に集計する | 年別集計 |

---

### 3.2 API層（ユニットテスト）

外部APIの呼び出しをモックに差し替えてテスト。正常・エラー・タイムアウトの3パターンをカバー。

#### `tests/api/steam.test.js`（10テスト）

Steam Web API からのゲーム情報取得。モック: `global.fetch = jest.fn()`

| describe | テスト | 検証内容 |
|----------|-------|---------|
| fetchOwnedGames | 正常レスポンスから Game 配列を返す | 正常系 |
| | HTTP エラーは AppError を返す | HTTP 500 |
| | ネットワークエラーは AppError を返す | ネットワーク障害 |
| | レスポンスに games がない場合は空配列を返す | 空レスポンス |
| fetchAppDetails | 正常レスポンスから Game の詳細フィールドを返す | 正常系 |
| | success: false の場合は game=null, error を返す | API拒否 |
| | ネットワークエラーで AppError を返す | ネットワーク障害 |
| filterGamesOnly | type: "game" のみを通過させる | 正常フィルタ |
| | 空配列は空配列を返す | エッジケース |
| | type フィールドがない項目は除外する | 不正データ |

#### `tests/api/itad.test.js`（6テスト）

IsThereAnyDeal API からの価格・セール履歴取得。モック: `global.fetch = jest.fn()`

| describe | テスト | 検証内容 |
|----------|-------|---------|
| fetchCurrentPrice | 正常レスポンスから価格情報を Game に変換する | 正常系 |
| | deals が空の場合は game=null を返す | 空データ |
| | HTTP エラーで AppError を返す | HTTP 429 レートリミット |
| | ネットワークエラーで AppError を返す | ネットワーク障害 |
| fetchPriceHistory | 正常レスポンスからセール履歴を返す | 正常系 |
| | ネットワークエラーで AppError を返す | ネットワーク障害 |

#### `tests/api/hltb.test.js`（4テスト）

HowLongToBeat からのクリア時間取得。モック: `jest.mock('howlongtobeat', ..., { virtual: true })`

| describe | テスト | 検証内容 |
|----------|-------|---------|
| fetchHltb | 正常レスポンスから hltbMain（分）を返す | 時間→分変換 |
| | 検索結果が空の場合は null を返す | 未登録ゲーム |
| | エラー発生時は AppError を返す | ネットワーク障害 |
| | gameplayMain が 0 の場合は null を返す | マルチ専用ゲーム |

---

### 3.3 main層（ユニットテスト）

Electron 固有のモジュール。`electron`, `electron-store`, `ps-list` をモックに差し替え。

#### `tests/main/store.test.js`（8テスト）

永続化ストア（electron-store ラッパー）。モック: インメモリ Map

| describe | テスト | 検証内容 |
|----------|-------|---------|
| library | 初期状態ではライブラリは空配列 | 初期値 |
| | ライブラリを保存して取得できる | CRUD |
| tagProfile | 初期状態では null | 初期値 |
| | TagProfile を保存して取得できる | CRUD |
| settings | 存在しない設定はデフォルト値を返す | デフォルト |
| | 設定を保存して取得できる | CRUD |
| watchlist | 初期状態では空配列 | 初期値 |
| | ウォッチリストを保存して取得できる | CRUD |

#### `tests/main/cache-manager.test.js`（10テスト）

キャッシュ管理（TTL + Stale-While-Revalidate）。モック: `electron-store` + `Date.now` スパイ

| describe | テスト | 検証内容 |
|----------|-------|---------|
| get/set | キャッシュにデータを保存して取得できる | 基本操作 |
| | 存在しないキーは data=null を返す | ミス |
| | TTL 内のデータは stale=false | 鮮度判定（新鮮） |
| | TTL 超過のデータは stale=true だが data は返す | 鮮度判定（古い） |
| invalidate/clear | 特定のキーのキャッシュを削除できる | 単一削除 |
| | 全キャッシュを削除できる | 全削除 |
| fetchWithCache | キャッシュがない場合は fetcher を呼んで結果をキャッシュする | SWR: ミス |
| | キャッシュが有効なら fetcher を呼ばない | SWR: ヒット |
| | キャッシュが stale なら stale データを返しつつ fetcher を呼ぶ | SWR: 再検証 |
| | fetcher がエラーを返した場合、error を返す | エラー伝播 |

#### `tests/main/activity-monitor.test.js`（5テスト）

ゲームプロセスの監視。モック: `ps-list` + `electron-store` + `Date.now` スパイ

| describe | テスト | 検証内容 |
|----------|-------|---------|
| scan | 新しいゲームプロセスを検出するとセッションを開始する | プロセス検出 |
| | プロセスが消失するとセッションを終了する | セッション終了＋所要時間計算 |
| | ゲーム以外のプロセスは無視する | フィルタリング |
| | 複数ゲームの同時実行を検出する | 並行セッション |
| registerMapping | 新しいマッピングを追加できる | マッピング登録 |

#### `tests/main/ipc-handlers.test.js`（36テスト）

Electron IPC ハンドラー全16チャネル。モック: `electron` (ipcMain) + `electron-store`

| describe | テスト数 | 検証内容 |
|----------|---------|---------|
| registerHandlers | 6 | 全16チャネル名の登録確認 |
| get-library | 1 | ストアのライブラリ取得 |
| get/set-watchlist | 2 | ウォッチリストの読み書き |
| add-watchlist-entry | 3 | エントリ追加、重複防止 |
| remove-watchlist-entry | 2 | エントリ削除 |
| get-backlog-analysis | 2 | 積みゲー分析（通常＋空） |
| get-statistics | 2 | 統計情報（通常＋空） |
| get-recommendations | 1 | レコメンド生成 |
| refresh-library | 3 | ライブラリ更新（fetcher有り/無し） |
| get-activity-summary | 3 | アクティビティ集計（通常＋monitor無し） |
| search-similar | 2 | 類似ゲーム検索 |
| get-sale-prediction | 2 | セール予測＋購入アドバイス |
| clear-cache | 2 | キャッシュクリア |
| export-data | 2 | データエクスポート |
| createHandler | 2 | 成功/エラーの統一ラッピング |

---

### 3.4 renderer層（コンポーネントテスト）

#### `tests/renderer/components.test.js`（14テスト）

UI コンポーネントの HTML 出力検証。`global.window` を手動設定。

| describe | テスト | 検証内容 |
|----------|-------|---------|
| GameCard | window.GameCard が登録される | IIFE 登録 |
| | タイトルと価格を表示する | 基本表示 |
| | タイトルがない場合は id を表示する | フォールバック |
| | 価格がない場合は -- を表示する | null 表示 |
| | プレイ時間がない場合は -- を表示する | null 表示 |
| | スコアがある場合は表示する | オプション表示 |
| | タグは最大5個まで表示する | 上限制約 |
| PriceBar | window.PriceBar が登録される | IIFE 登録 |
| | null データは空文字を返す | null 安全性 |
| | 現在価格を表示する | 基本表示 |
| | 最安値を表示する | 最安値＋ストア名 |
| | 歴代最安値を表示する | 歴代最安値 |
| | 次回セール月を表示する | セール予測 |
| | 全フィールドを表示する | フル表示 |

---

### 3.5 統合テスト

複数モジュールをまたぐパイプラインの一貫性検証。

#### `tests/integration/recommendation-pipeline.test.js`（4テスト）

ライブラリ → タグプロファイル → レコメンドの一気通貫フロー。

| テスト | 検証内容 |
|-------|---------|
| タグプロファイル算出 → 候補ランキングが一貫して動作する | RPG系が上位に来ること |
| 類似ゲーム検索: 特定ゲームに似た候補をスコアリングできる | rarity ベースの類似度 |
| Steam + ITAD でマージしたデータからプロファイルを構築できる | マルチソースマージ |
| aggregateTags の結果と calculateTagProfile の重みの方向性が一致する | モジュール間整合性 |

#### `tests/integration/analysis-pipeline.test.js`（6テスト）

積みゲー分析 + コスパ分析 + セール予測 + 購入アドバイスの横断。

| テスト | 検証内容 |
|-------|---------|
| 積みゲー分析で分類されたゲームのコスパも算出できる | 分析横断 |
| 積みゲーの無駄遣い額とコスパが相関する | メトリクス整合 |
| セール実績が多いゲームは wait を推奨する | 予測→判定フロー |
| 歴代最安値に近い場合は buy_now を推奨する | 購入推奨 |
| 価格データ不足の場合は unknown を返す | データ不足対応 |
| Steam + ITAD + HLTB のマージデータで積みゲー分析ができる | 3ソース統合 |

#### `tests/integration/activity-pipeline.test.js`（5テスト）

月別 → 四半期 → 年別のアクティビティ集計パイプライン。

| テスト | 検証内容 |
|-------|---------|
| 月別サマリーが正しく集計される | 月別精度 |
| 月別→四半期別が一貫して集計される | Q1〜Q4 正確性 |
| 月別→年別が一貫して集計される | 年間集計 |
| 四半期の合計と年の合計が一致する | クロスチェック |
| 空セッションは空の月別・四半期・年別を返す | エッジケース |

#### `tests/integration/cache-api-pipeline.test.js`（6テスト）

キャッシュ + API + ストアの統合フロー。モック: `electron-store` + `Date.now` スパイ

| テスト | 検証内容 |
|-------|---------|
| API取得 → キャッシュ保存 → ストア永続化の一連フロー | ラウンドトリップ |
| キャッシュ stale → SWR で旧データ返却しつつバックグラウンド更新 | SWR 動作 |
| 複数APIのキャッシュデータをマージしてレコメンドを生成 | マルチソースキャッシュ |
| API失敗でもストアの既存データでレコメンドが可能 | エラーフォールバック |
| ウォッチリストの保存と取得 | ストアCRUD |
| 設定の保存と取得 | ストアCRUD |

---

### 3.6 E2Eテスト

Playwright + Electron で実際のアプリケーションを起動して検証。

#### `tests/e2e/app.e2e.test.js`（ソースコードから起動・24テスト）

```bash
npm run test:e2e
```

| カテゴリ | テスト | 検証内容 |
|---------|-------|---------|
| ウィンドウ | ウィンドウが表示される | タイトル = "Steam Analyzer" |
| | ウィンドウサイズが設定値以上 | 幅 >= 700, 高さ >= 400 |
| ナビゲーション | 5つのタブボタンがある | タブ数 |
| | Store/Recommendタブが初期表示 | 初期状態 |
| | タブ切り替えが動作する | 5タブ切り替え |
| | アクティブなタブボタンにactiveクラスが付く | CSS クラス |
| Store/Recommend | モード切替ボタンがある | Store / Recommend |
| | Storeモードでストアプレビューが表示される | モード切替 |
| Settings | 設定フォームがある | Save ボタン |
| | データ管理ボタンがある | Refresh / Export / Clear |
| IPC通信 | api オブジェクトがrendererに公開されている | preload 確認 |
| | api.getLibrary が呼べる | IPC ラウンドトリップ |
| | api.getSettings が呼べる | IPC ラウンドトリップ |
| | api.setSettings / getSettings ラウンドトリップ | 読み書き |
| | api.getWatchlist が空配列を返す | 初期状態 |
| | api.addWatchlistEntry / removeWatchlistEntry ラウンドトリップ | CRUD |
| | api.getStatistics が呼べる | IPC ラウンドトリップ |
| | api.getBacklogAnalysis が呼べる | IPC ラウンドトリップ |
| | api.getActivitySummary が呼べる | IPC ラウンドトリップ |
| | api.clearCache が成功する | IPC ラウンドトリップ |
| | api.exportData が全データを返す | IPC ラウンドトリップ |
| セキュリティ | Content-Security-Policyが設定されている | CSP メタタグ |
| | nodeIntegration が無効 | require 不可 |
| | Node.js グローバルがrendererに漏れていない | process 不可 |

#### `tests/e2e/build.e2e.test.js`（ビルド済みバイナリから起動）

ビルド済みバイナリに対する検証。**事前に `npm run pack` が必要。**

```bash
npm run pack          # 先にビルド
npm run test:e2e      # E2Eテスト実行（build.e2e含む）
```

| テスト | 検証内容 |
|-------|---------|
| ビルド済みバイナリでウィンドウが表示される | バイナリ動作確認 |
| ビルド済みバイナリで5タブが存在する | UI 完全性 |
| ビルド済みバイナリでタブ切り替えが動作する | ナビゲーション |
| ビルド済みバイナリでapiオブジェクトが公開されている | preload |
| ビルド済みバイナリでIPC通信が動作する | IPC |
| ビルド済みバイナリでSettings読み書きが動作する | ストア |
| ビルド済みバイナリでcontextIsolationが有効 | セキュリティ |
| ビルド済みバイナリでCSPが設定されている | セキュリティ |

> **注意**: `build.e2e.test.js` のバイナリパスは `dist/linux-unpacked/steam-analyzer` にハードコードされています。
> macOS の場合は `dist/mac/Steam Analyzer.app`、Windows の場合は `dist/win-unpacked/Steam Analyzer.exe` に変更が必要です。

---

## 4. トラブルシューティング

### 4.1 `npm install` でネイティブモジュールのビルドエラー

**症状**: `node-gyp`, `electron`, `prebuild-install` 関連のエラー

**原因**: C++ ビルドツールが未インストール

**対処**:

```bash
# Linux (Debian/Ubuntu)
sudo apt install build-essential

# macOS
xcode-select --install

# Windows
npm install --global windows-build-tools
```

---

### 4.2 `Cannot find module 'electron'` でテスト失敗

**症状**: `tests/main/` のテストが import 時にエラー

**原因**: `node_modules` が未インストール

**対処**:

```bash
npm install
```

テストコード内で `{ virtual: true }` フラグ付きのモックを使用しているため、Electron のネイティブバイナリに問題があってもテストは通ります。`npm install` さえ完了していれば OK です。

---

### 4.3 E2Eテストで `Electron launch failed`

**症状**: `npm run test:e2e` で Electron が起動しない

**原因と対処**:

| 原因 | 対処 |
|------|------|
| Electron 未インストール | `npm install` を再実行 |
| Linux ヘッドレス環境（CI等） | `xvfb-run npx playwright test` |
| Playwright 未インストール | `npx playwright install` |

---

### 4.4 `build.e2e.test.js` で ENOENT エラー

**症状**: `Error: ENOENT: no such file or directory, stat '.../dist/linux-unpacked/steam-analyzer'`

**原因**: パッケージングがまだ実行されていない

**対処**:

```bash
npm run pack    # パッケージング実行（dist/ にバイナリが生成される）
npm run test:e2e
```

---

### 4.5 テストの timeout 失敗

**症状**: `Timeout - Async callback was not invoked within the 5000 ms timeout`

**原因**: マシン負荷が高い、または CI 環境で実行が遅い

**対処**:

```bash
# Jest のタイムアウトを延長
npx jest --testTimeout=10000

# Playwright のタイムアウトは playwright.config.js の timeout を変更
# 現在値: 30000 (30秒)
```

---

### 4.6 `Date.now` モック漏れによるテスト不安定

**対象ファイル**: `tests/main/cache-manager.test.js`, `tests/main/activity-monitor.test.js`

**症状**: TTL 判定が不安定（stale/fresh が期待と逆になる）

**原因**: `afterEach` で `jest.restoreAllMocks()` が漏れている

**確認ポイント**:

```javascript
// このパターンが各テストファイルにあることを確認
afterEach(() => {
  jest.restoreAllMocks();
});
```

---

### 4.7 renderer コンポーネントテストで `undefined` エラー

**対象ファイル**: `tests/renderer/components.test.js`

**症状**: `TypeError: Cannot read properties of undefined (reading 'render')`

**原因**: IIFE コンポーネントは `require()` 時に `window` に登録される。モジュールキャッシュが残っていると再登録されない。

**確認ポイント**:

```javascript
// beforeEach で jest.resetModules() があることを確認
beforeEach(() => {
  global.window = global.window || {};
  delete global.window.GameCard;
  delete global.window.PriceBar;
  jest.resetModules();  // ← これが必須
});
```

---

### 4.8 `global.fetch` モック漏れ

**対象ファイル**: `tests/api/steam.test.js`, `tests/api/itad.test.js`

**症状**: あるテストが別のテストのモックレスポンスを受け取る

**原因**: `afterEach` で `jest.resetAllMocks()` が漏れている

**確認ポイント**:

```javascript
global.fetch = jest.fn();

afterEach(() => {
  jest.resetAllMocks();  // ← これが必須
});
```

---

### 4.9 `testEnvironment` を `jsdom` に変更してはいけない

**症状**: `jsdom` に変更すると main層テストや renderer テストが壊れる

**理由**:

- main層テストは `jest.mock('electron', ...)` を使用。jsdom 環境では挙動が変わる
- renderer コンポーネントテストは手動で `global.window` を設定しており、jsdom の `window` と競合する

**対処**: `testEnvironment: "node"` のまま使用してください。

---

### 4.10 `howlongtobeat` パッケージが package.json にない

**症状**: `package.json` に `howlongtobeat` が含まれていないが、テストは通っている

**説明**: これは意図的な設計です。

- `tests/api/hltb.test.js` で `jest.mock('howlongtobeat', ..., { virtual: true })` を使用
- `{ virtual: true }` により、実際のパッケージがなくてもモックが生成される
- 実行時のみ必要なパッケージのため、テスト段階では不要

**注意**: `howlongtobeat` を `package.json` に追加すると、モックではなく実モジュールが読み込まれ、テストの挙動が変わる可能性があります。
