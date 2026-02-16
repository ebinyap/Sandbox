'use strict';

const ElectronStore = require('electron-store');

/**
 * CacheManager — TTL管理、Stale-While-Revalidate パターン
 *
 * CacheEntry: { key, data, fetchedAt, ttlMs, source }
 * CacheResult: { data, stale, error }
 */
class CacheManager {
  constructor() {
    this._store = new ElectronStore();
  }

  /**
   * キャッシュからデータを取得する
   * @param {string} key
   * @returns {{ data: any|null, stale: boolean, error: AppError|null }}
   */
  get(key) {
    const entry = this._store.get(key);
    if (!entry) {
      return { data: null, stale: false, error: null };
    }

    const age = Date.now() - entry.fetchedAt;
    const stale = age > entry.ttlMs;

    return { data: entry.data, stale, error: null };
  }

  /**
   * キャッシュにデータを保存する
   * @param {string} key
   * @param {any} data
   * @param {{ ttlMs: number, source: string }} options
   */
  set(key, data, { ttlMs, source }) {
    this._store.set(key, {
      key,
      data,
      fetchedAt: Date.now(),
      ttlMs,
      source,
    });
  }

  /**
   * 特定キーのキャッシュを無効化する
   * @param {string} key
   */
  invalidate(key) {
    this._store.delete(key);
  }

  /**
   * 全キャッシュをクリアする
   */
  clear() {
    this._store.clear();
  }

  /**
   * Stale-While-Revalidate パターンでデータを取得する
   *
   * 1. キャッシュが有効 → キャッシュを返す（fetcher 呼ばない）
   * 2. キャッシュが stale → stale データを即返し、バックグラウンドで fetcher を呼ぶ
   * 3. キャッシュなし → fetcher を呼んで結果を返す
   *
   * @param {string} key
   * @param {Function} fetcher  () => Promise<{ data, error }>
   * @param {{ ttlMs: number, source: string }} options
   * @returns {Promise<{ data: any|null, stale: boolean, error: AppError|null }>}
   */
  async fetchWithCache(key, fetcher, { ttlMs, source }) {
    const cached = this.get(key);

    // 1. キャッシュが有効
    if (cached.data && !cached.stale) {
      return cached;
    }

    // 2. キャッシュが stale — stale データを返しつつ fetcher でバックグラウンド更新
    if (cached.data && cached.stale) {
      // バックグラウンドで更新（結果は await しない設計だが、テスト容易性のため await する）
      fetcher().then((result) => {
        if (result.data) {
          this.set(key, result.data, { ttlMs, source });
        }
      });
      return { data: cached.data, stale: true, error: null };
    }

    // 3. キャッシュなし — fetcher を呼ぶ
    const result = await fetcher();
    if (result.data) {
      this.set(key, result.data, { ttlMs, source });
    }
    return {
      data: result.data,
      stale: false,
      error: result.error || null,
    };
  }
}

module.exports = CacheManager;
