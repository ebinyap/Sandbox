'use strict';

const { createGame, createAppError } = require('../../src/engine/models');
const { mergeGames } = require('../../src/engine/aggregator');
const { calculateTagProfile, rankCandidates } = require('../../src/engine/scorer');

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
const Store = require('../../src/main/store');

describe('統合: キャッシュ・ストア・APIパイプライン', () => {
  let cache;
  let store;

  beforeEach(() => {
    cache = new CacheManager();
    store = new Store();
    jest.spyOn(Date, 'now');
    Date.now.mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- キャッシュ → API → ストア ---
  describe('キャッシュ経由のデータ取得とストア永続化', () => {
    test('API取得 → キャッシュ保存 → ストア永続化の一連フロー', async () => {
      const steamGames = [
        createGame({ id: '1', title: 'Half-Life 2', tags: ['FPS'], playtimeMinutes: 500, sourceFlags: ['steam'] }),
        createGame({ id: '2', title: 'Portal 2', tags: ['Puzzle'], playtimeMinutes: 200, sourceFlags: ['steam'] }),
      ];

      // API fetcher のモック
      const steamFetcher = jest.fn().mockResolvedValue({
        data: steamGames,
        error: null,
      });

      // fetchWithCache でキャッシュ経由取得
      const result = await cache.fetchWithCache('steam:library', steamFetcher, {
        ttlMs: 3600000,
        source: 'steam',
      });

      expect(result.data).toEqual(steamGames);
      expect(steamFetcher).toHaveBeenCalledTimes(1);

      // ストアに永続化
      store.setLibrary(result.data);
      expect(store.getLibrary()).toEqual(steamGames);

      // 2回目の取得はキャッシュから（fetcher呼ばない）
      Date.now.mockReturnValue(2000);
      const cached = await cache.fetchWithCache('steam:library', steamFetcher, {
        ttlMs: 3600000,
        source: 'steam',
      });
      expect(cached.data).toEqual(steamGames);
      expect(steamFetcher).toHaveBeenCalledTimes(1); // 呼ばれていない
    });

    test('キャッシュ stale → SWR で旧データ返却しつつバックグラウンド更新', async () => {
      const oldGames = [createGame({ id: '1', title: 'Old', sourceFlags: ['steam'] })];
      const newGames = [createGame({ id: '1', title: 'Updated', sourceFlags: ['steam'] })];

      Date.now.mockReturnValue(1000);
      cache.set('steam:library', oldGames, { ttlMs: 60000, source: 'steam' });

      const fetcher = jest.fn().mockResolvedValue({ data: newGames, error: null });

      // TTL超過
      Date.now.mockReturnValue(70000);
      const result = await cache.fetchWithCache('steam:library', fetcher, {
        ttlMs: 60000,
        source: 'steam',
      });

      // stale データが即座に返る
      expect(result.data).toEqual(oldGames);
      expect(result.stale).toBe(true);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  // --- マルチソースマージ + キャッシュ ---
  describe('マルチソースキャッシュ → マージ → レコメンド', () => {
    test('複数APIのキャッシュデータをマージしてレコメンドを生成', async () => {
      const steamGames = [
        createGame({ id: '1', title: 'Skyrim', tags: ['RPG', 'Open World'], playtimeMinutes: 3000, sourceFlags: ['steam'] }),
        createGame({ id: '2', title: 'Portal', tags: ['Puzzle', 'FPS'], playtimeMinutes: 300, sourceFlags: ['steam'] }),
      ];
      const itadGames = [
        createGame({ id: '1', currentPrice: 9.99, historicalLow: 4.99, sourceFlags: ['itad'] }),
        createGame({ id: '2', currentPrice: 4.99, historicalLow: 1.99, sourceFlags: ['itad'] }),
      ];

      // それぞれキャッシュに保存
      cache.set('steam:library', steamGames, { ttlMs: 3600000, source: 'steam' });
      cache.set('itad:prices', itadGames, { ttlMs: 3600000, source: 'itad' });

      // キャッシュから取得
      const steamResult = cache.get('steam:library');
      const itadResult = cache.get('itad:prices');

      // マージ
      const merged = mergeGames([...steamResult.data, ...itadResult.data]);
      expect(merged.length).toBe(2);
      expect(merged[0].title).toBe('Skyrim');
      expect(merged[0].currentPrice).toBe(9.99);

      // ストアに永続化
      store.setLibrary(merged);

      // タグプロファイル構築
      const profile = calculateTagProfile(merged);
      store.setTagProfile(profile);

      // レコメンド生成
      const candidates = [
        createGame({ id: '10', tags: ['RPG', 'Fantasy'], reviewScore: 90, reviewCount: 5000 }),
        createGame({ id: '11', tags: ['Racing', 'Sports'], reviewScore: 80, reviewCount: 2000 }),
      ];

      const savedProfile = store.getTagProfile();
      const ranked = rankCandidates(candidates, savedProfile, {});
      expect(ranked.length).toBe(2);
      // RPG系が上位
      expect(ranked[0].game.id).toBe('10');
    });
  });

  // --- エラー時のフォールバック ---
  describe('API エラー時のフォールバック', () => {
    test('API失敗でもストアの既存データでレコメンドが可能', async () => {
      // 事前にストアにデータ保存
      const existingGames = [
        createGame({ id: '1', title: 'Skyrim', tags: ['RPG'], playtimeMinutes: 3000 }),
      ];
      store.setLibrary(existingGames);
      store.setTagProfile(calculateTagProfile(existingGames));

      // APIがエラーを返す
      const error = createAppError({ source: 'steam', type: 'network', message: 'timeout' });
      const fetcher = jest.fn().mockResolvedValue({ data: null, error });

      const result = await cache.fetchWithCache('steam:library', fetcher, {
        ttlMs: 3600000,
        source: 'steam',
      });
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();

      // ストアのデータでレコメンドは動作する
      const profile = store.getTagProfile();
      const candidates = [createGame({ id: '10', tags: ['RPG'], reviewScore: 85, reviewCount: 1000 })];
      const ranked = rankCandidates(candidates, profile, {});
      expect(ranked.length).toBe(1);
      expect(ranked[0].score).toBeGreaterThan(0);
    });
  });

  // --- ストア設定の読み書き ---
  describe('ストア設定管理', () => {
    test('ウォッチリストの保存と取得', () => {
      const watchlist = [
        { gameId: '1', targetPrice: 9.99, addedAt: Date.now() },
        { gameId: '2', targetPrice: 4.99, addedAt: Date.now() },
      ];
      store.setWatchlist(watchlist);
      expect(store.getWatchlist()).toEqual(watchlist);
    });

    test('設定の保存と取得', () => {
      store.setSetting('steamId', '76561198000000000');
      store.setSetting('apiKey', 'ABC123');
      expect(store.getSetting('steamId')).toBe('76561198000000000');
      expect(store.getSetting('apiKey')).toBe('ABC123');
      expect(store.getSetting('nonexistent', 'default')).toBe('default');
    });
  });
});
