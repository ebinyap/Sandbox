# CLAUDE.md — Steam Analyzer プロジェクト指示書

## このファイルの目的

Claude（AI）がこのプロジェクトで作業する際に、毎セッション最初に読む指示書。
仕様の詳細は `steam-analyzer-spec.md` を参照すること。

---

## セッション開始時に必ず行うこと

```
1. この CLAUDE.md を読む（今読んでいる）
2. PROGRESS.md を読み、現在のステータスと次にやるべきことを確認する
3. git log --oneline -20 で直近のコミット履歴を確認する
4. npm test を実行してテストの状態を確認する
5. ユーザーに「前回の続きから始めます。現在の状態は〜」と報告する
```

---

## 絶対に守るルール

### TDD: RED-GREEN-REFACTOR

テストなしのコード追加・変更は禁止。必ずこのサイクルに従う。

- **RED** — 失敗するテストを先に書く
- **GREEN** — テストを通す最小限の実装を書く
- **REFACTOR** — テストが通ったまま品質改善

バグ修正もまずバグを再現するテストを書いてから修正する。

### コミットメッセージ

```
[RED]      モジュール: 内容
[GREEN]    モジュール: 内容
[REFACTOR] モジュール: 内容
[PROGRESS] PROGRESS.md 更新
[FIX]      モジュール: 内容（RED-GREEN含む）
[DOCS]     対象: 内容
```

### PROGRESS.md の更新

作業の区切りごとに PROGRESS.md を更新してコミットする。
特に以下のタイミングで必須:
- 関数実装完了時
- テスト通過時
- リファクタリング完了時
- セッション終了時

### セッション終了時

トークン上限が近づいたら:
1. テストが全パスする状態にする
2. 作業中の変更をコミットする
3. PROGRESS.md を更新してコミットする
4. ユーザーに報告する

**テストが壊れた状態での終了は禁止。**

---

## プロジェクト構成

```
steam-analyzer/
├── CLAUDE.md                    ← この指示書
├── PROGRESS.md                  ← 進捗管理（毎セッション更新）
├── steam-analyzer-spec.md       ← 仕様書本体
├── docs/
│   ├── decisions.md             ← 実装中の設計判断記録
│   └── api-notes.md             ← 外部API仕様メモ
├── src/
│   ├── api/                     ← 外部API通信（steam.js, itad.js, hltb.js）
│   ├── engine/                  ← 純ロジック（scorer.js, tag-manager.js 等）
│   ├── main/                    ← Electron制御（cache-manager.js, activity-monitor.js 等）
│   └── renderer/                ← UI（tabs/, components/）
├── tests/
│   ├── api/
│   ├── engine/
│   └── main/
└── package.json
```

## レイヤー間の鉄則

- **api層** → 外部APIを叩いて内部共通モデル(Game等)に変換する唯一の場所
- **engine層** → 外部APIを一切知らない。内部モデルだけで計算する純ロジック
- **main層** → Electron制御、キャッシュ、IPC、通知
- **renderer層** → 表示のみ。API直接呼び出し禁止

---

## 仕様書の参照方法

仕様書 `steam-analyzer-spec.md` は全29セクション、約1200行ある。
全部読む必要はない。作業対象に応じて必要なセクションだけ読む。

### セクションIDで参照

仕様書の各セクションには `[SEC-xxx]` のIDが付いている。

| 作業内容 | 読むべきセクション |
|---------|------------------|
| データモデルを確認したい | SEC-MODEL-GAME, SEC-MODEL-xxx |
| レコメンドエンジンを実装 | SEC-RECOMMEND, SEC-SIMILAR, SEC-MODEL-TAG |
| キャッシュ周りを実装 | SEC-CACHE, SEC-MODEL-CACHE |
| エラーハンドリングを実装 | SEC-ERROR, SEC-MODEL-ERROR, SEC-MODEL-FETCH |
| 積みゲー分析を実装 | SEC-TAB-BACKLOG, SEC-MODEL-BACKLOG |
| セール予測を実装 | SEC-MODEL-SALE, SEC-TAB-STORE |
| ウォッチリストを実装 | SEC-TAB-WATCH, SEC-MODEL-WATCH |
| アクティビティログを実装 | SEC-ACTIVITY, SEC-MODEL-ACTIVITY |
| UIを実装 | SEC-TAB-STORE, SEC-TAB-WATCH, SEC-TAB-STATS, SEC-TAB-BACKLOG, SEC-TAB-SETTINGS |
| テスト方針を確認 | SEC-TEST |
| 実装順序を確認 | SEC-SESSION（実装順序ガイドライン） |

### 仕様変更が必要なとき

ユーザーに以下のフォーマットで確認を取る:

```
【変更種別】追加 / 修正 / 削除
【対象セクション】SEC-xxx
【変更内容】...
【理由】...
【影響範囲】...
```

仕様書の変更履歴（冒頭）も更新すること。

---

## 実装順序（概要）

詳細は仕様書 SEC-SESSION を参照。

```
Phase 1: 基盤         → データモデル型定義, store.js, steam.js, aggregator.js
Phase 2: コアエンジン  → tag-manager.js, scorer.js, itad.js, hltb.js
Phase 3: キャッシュ・エラー → cache-manager.js, AppError組み込み
Phase 4: 分析エンジン  → backlog-analyzer.js, sale-predictor.js, cost-analyzer.js, purchase-advisor.js
Phase 5: アクティビティ → activity-monitor.js, activity-analyzer.js
Phase 6: Electron・UI  → ipc-handlers.js, notifier.js, tray.js, renderer/
Phase 7: 統合・仕上げ  → 結合テスト, UX改善
```

---

## 困ったとき

- 仕様が曖昧 → `docs/decisions.md` に判断を記録し、ユーザーに確認
- API仕様が不明 → `docs/api-notes.md` に調査結果を記録
- 実装方針に迷い → ユーザーに選択肢を提示して判断を仰ぐ
- 前回の作業が不明 → PROGRESS.md と git log で確認
