# 設計判断記録

## 2026-02-16: TagRarity 算出方式

**判断:** `rarity = 1 - (出現ゲーム数 / 総ゲーム数)` のシンプルな方式を採用。
**理由:** TF-IDF の DF 部分に相当。ゲーム数が1本以下の場合は全て0を返す（分散が計算不能）。
**代替案:** log ベースの IDF 計算も検討したが、初期実装としてはシンプルな線形方式で十分。

## 2026-02-16: aggregator のマージ戦略

**判断:** base（先に登場した方）の非null値を優先。tags/genres は base のみ使用（マージしない）。
**理由:** Steam が最も信頼性の高いタグ/ジャンル情報を持つため。sourceFlags のみ和集合でマージ。

## 2026-02-16: store.js の設定管理

**判断:** settings は単一オブジェクトとして保存し、キー別にアクセス。
**理由:** electron-store の get/set と相性がよく、設定追加時の拡張性も高い。

## 2026-02-16: notifier/tray のユニットテスト省略

**判断:** notifier.js と tray.js はユニットテストを書かない。
**理由:** Electron の Notification/Tray/Menu API に密結合しており、モック化のコストが高い。SEC-TEST の「renderer層: ユニットテスト不要（E2Eテスト将来）」方針に準じ、将来の統合テスト/E2Eテストでカバーする。

## 2026-02-16: IPC ハンドラーの統一レスポンス形式

**判断:** `{ success: boolean, data: any, error: string|null }` の統一形式を採用。
**理由:** renderer 側でのエラーハンドリングをシンプルにする。createHandler ラッパーで自動変換。
