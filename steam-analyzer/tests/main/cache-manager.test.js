'use strict';

const { createGame, createAppError } = require('../../src/engine/models');

// electron-store モック
jest.mock('electron-store', () => {
  return class MockStore {
    constructor() {
      this._data = new Map();
    }
    get(key, defaultValue) {
      return this._data.has(key) ? this._data.get(key) : defaultValue;
    }
    set(key, value) {
      this._data.set(key, value);
    }
    delete(key) {
      this._data.delete(key);
    }
    has(key) {
      return this._data.has(key);
    }
    clear() {
      this._data.clear();
    }
  };
}, { virtual: true });

const CacheManager = require('../../src/main/cache-manager');

describe('cache-manager', () => {
  let cache;

  beforeEach(() => {
    cache = new CacheManager();
    jest.spyOn(Date, 'now');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- get / set ---
  describe('get / set', () => {
    test('キャッシュにデータを保存して取得できる', () => {
      const game = createGame({ id: '440', title: 'TF2' });
      Date.now.mockReturnValue(1000);
      cache.set('steam:library:440', game, { ttlMs: 60000, source: 'steam' });

      Date.now.mockReturnValue(2000);
      const result = cache.get('steam:library:440');
      expect(result.data).toEqual(game);
      expect(result.stale).toBe(false);
      expect(result.error).toBeNull();
    });

    test('存在しないキーは data=null を返す', () => {
      const result = cache.get('nonexistent');
      expect(result.data).toBeNull();
      expect(result.stale).toBe(false);
      expect(result.error).toBeNull();
    });
  });

  // --- TTL ---
  describe('TTL', () => {
    test('TTL 内のデータは stale=false', () => {
      const game = createGame({ id: '440' });
      Date.now.mockReturnValue(1000);
      cache.set('key', game, { ttlMs: 60000, source: 'steam' });

      Date.now.mockReturnValue(50000); // 49秒後
      const result = cache.get('key');
      expect(result.stale).toBe(false);
    });

    test('TTL 超過のデータは stale=true だが data は返す', () => {
      const game = createGame({ id: '440' });
      Date.now.mockReturnValue(1000);
      cache.set('key', game, { ttlMs: 60000, source: 'steam' });

      Date.now.mockReturnValue(70000); // 69秒後（TTL 60秒超過）
      const result = cache.get('key');
      expect(result.data).toEqual(game);
      expect(result.stale).toBe(true);
    });
  });

  // --- invalidate ---
  describe('invalidate', () => {
    test('特定のキーのキャッシュを削除できる', () => {
      const game = createGame({ id: '440' });
      Date.now.mockReturnValue(1000);
      cache.set('key', game, { ttlMs: 60000, source: 'steam' });

      cache.invalidate('key');
      const result = cache.get('key');
      expect(result.data).toBeNull();
    });
  });

  // --- clear ---
  describe('clear', () => {
    test('全キャッシュを削除できる', () => {
      Date.now.mockReturnValue(1000);
      cache.set('a', createGame({ id: '1' }), { ttlMs: 60000, source: 'steam' });
      cache.set('b', createGame({ id: '2' }), { ttlMs: 60000, source: 'itad' });

      cache.clear();
      expect(cache.get('a').data).toBeNull();
      expect(cache.get('b').data).toBeNull();
    });
  });

  // --- fetchWithCache (Stale-While-Revalidate) ---
  describe('fetchWithCache', () => {
    test('キャッシュがない場合は fetcher を呼んで結果をキャッシュする', async () => {
      const game = createGame({ id: '440', title: 'TF2' });
      const fetcher = jest.fn().mockResolvedValue({ data: game, error: null });
      Date.now.mockReturnValue(1000);

      const result = await cache.fetchWithCache('key', fetcher, { ttlMs: 60000, source: 'steam' });
      expect(result.data).toEqual(game);
      expect(fetcher).toHaveBeenCalledTimes(1);

      // キャッシュに保存されたか確認
      const cached = cache.get('key');
      expect(cached.data).toEqual(game);
    });

    test('キャッシュが有効なら fetcher を呼ばない', async () => {
      const game = createGame({ id: '440' });
      Date.now.mockReturnValue(1000);
      cache.set('key', game, { ttlMs: 60000, source: 'steam' });

      const fetcher = jest.fn();
      Date.now.mockReturnValue(2000);
      const result = await cache.fetchWithCache('key', fetcher, { ttlMs: 60000, source: 'steam' });
      expect(result.data).toEqual(game);
      expect(fetcher).not.toHaveBeenCalled();
    });

    test('キャッシュが stale なら stale データを返しつつ fetcher を呼ぶ', async () => {
      const oldGame = createGame({ id: '440', title: 'Old' });
      const newGame = createGame({ id: '440', title: 'New' });
      Date.now.mockReturnValue(1000);
      cache.set('key', oldGame, { ttlMs: 60000, source: 'steam' });

      const fetcher = jest.fn().mockResolvedValue({ data: newGame, error: null });
      Date.now.mockReturnValue(70000); // TTL 超過

      const result = await cache.fetchWithCache('key', fetcher, { ttlMs: 60000, source: 'steam' });
      // stale データが即座に返る
      expect(result.data).toEqual(oldGame);
      expect(result.stale).toBe(true);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    test('fetcher がエラーを返した場合、error を返す', async () => {
      const error = createAppError({ source: 'steam', type: 'network', message: 'fail' });
      const fetcher = jest.fn().mockResolvedValue({ data: null, error });
      Date.now.mockReturnValue(1000);

      const result = await cache.fetchWithCache('key', fetcher, { ttlMs: 60000, source: 'steam' });
      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });
});
