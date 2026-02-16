'use strict';

// Electron モック
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    _handlers: {},
  },
}), { virtual: true });

jest.mock('electron-store', () => {
  return class MockStore {
    constructor() { this._data = new Map(); }
    get(key, def) { return this._data.has(key) ? this._data.get(key) : def; }
    set(key, val) { this._data.set(key, val); }
  };
}, { virtual: true });

const { createGame } = require('../../src/engine/models');
const { ipcMain } = require('electron');
const { registerHandlers, createHandler } = require('../../src/main/ipc-handlers');
const Store = require('../../src/main/store');

describe('ipc-handlers', () => {
  let handlers;
  let store;

  beforeEach(() => {
    ipcMain.handle.mockClear();
    handlers = {};
    ipcMain.handle.mockImplementation((channel, fn) => {
      handlers[channel] = fn;
    });
    store = new Store();
  });

  describe('registerHandlers', () => {
    test('複数の IPC ハンドラーを登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      expect(ipcMain.handle).toHaveBeenCalled();
      expect(ipcMain.handle.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    test('get-library, get-settings, set-settings を登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      const channels = ipcMain.handle.mock.calls.map((c) => c[0]);
      expect(channels).toContain('get-library');
      expect(channels).toContain('get-settings');
      expect(channels).toContain('set-settings');
    });

    test('get-watchlist, set-watchlist を登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      const channels = ipcMain.handle.mock.calls.map((c) => c[0]);
      expect(channels).toContain('get-watchlist');
      expect(channels).toContain('set-watchlist');
    });

    test('get-backlog-analysis を登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      const channels = ipcMain.handle.mock.calls.map((c) => c[0]);
      expect(channels).toContain('get-backlog-analysis');
    });

    test('get-statistics を登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      const channels = ipcMain.handle.mock.calls.map((c) => c[0]);
      expect(channels).toContain('get-statistics');
    });

    test('get-recommendations を登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      const channels = ipcMain.handle.mock.calls.map((c) => c[0]);
      expect(channels).toContain('get-recommendations');
    });
  });

  // --- ハンドラーの実動作テスト ---
  describe('get-library handler', () => {
    test('ストアのライブラリを返す', async () => {
      const games = [createGame({ id: '1', title: 'Skyrim' })];
      store.setLibrary(games);
      registerHandlers({ store, cacheManager: {} });
      const result = await handlers['get-library']({});
      expect(result.success).toBe(true);
      expect(result.data).toEqual(games);
    });
  });

  describe('get-watchlist handler', () => {
    test('ウォッチリストを返す', async () => {
      const watchlist = [{ gameId: '1', targetPrice: 9.99 }];
      store.setWatchlist(watchlist);
      registerHandlers({ store, cacheManager: {} });
      const result = await handlers['get-watchlist']({});
      expect(result.success).toBe(true);
      expect(result.data).toEqual(watchlist);
    });
  });

  describe('set-watchlist handler', () => {
    test('ウォッチリストを保存する', async () => {
      registerHandlers({ store, cacheManager: {} });
      const watchlist = [{ gameId: '1', targetPrice: 4.99 }];
      const result = await handlers['set-watchlist']({}, watchlist);
      expect(result.success).toBe(true);
      expect(store.getWatchlist()).toEqual(watchlist);
    });
  });

  describe('get-backlog-analysis handler', () => {
    test('ライブラリを積みゲー分析して返す', async () => {
      const games = [
        createGame({ id: '1', title: 'Skyrim', playtimeMinutes: 6000, hltbMain: 600, basePrice: 39.99 }),
        createGame({ id: '2', title: 'Untouched', playtimeMinutes: 0, hltbMain: 300, basePrice: 14.99 }),
      ];
      store.setLibrary(games);
      registerHandlers({ store, cacheManager: {} });
      const result = await handlers['get-backlog-analysis']({});
      expect(result.success).toBe(true);
      expect(result.data.summary.total).toBe(2);
      expect(result.data.entries.length).toBe(2);
    });

    test('ライブラリが空の場合は空結果を返す', async () => {
      registerHandlers({ store, cacheManager: {} });
      const result = await handlers['get-backlog-analysis']({});
      expect(result.success).toBe(true);
      expect(result.data.summary.total).toBe(0);
      expect(result.data.entries).toEqual([]);
    });
  });

  describe('get-statistics handler', () => {
    test('ライブラリの統計情報を返す', async () => {
      const games = [
        createGame({ id: '1', playtimeMinutes: 6000, basePrice: 39.99 }),
        createGame({ id: '2', playtimeMinutes: 300, basePrice: 19.99 }),
        createGame({ id: '3', playtimeMinutes: 0, basePrice: 9.99 }),
      ];
      store.setLibrary(games);
      registerHandlers({ store, cacheManager: {} });
      const result = await handlers['get-statistics']({});
      expect(result.success).toBe(true);
      expect(result.data.totalGames).toBe(3);
      expect(result.data.totalPlaytimeMinutes).toBe(6300);
      expect(result.data.totalSpend).toBeCloseTo(69.97, 1);
      expect(result.data.costRanking.length).toBe(3);
    });

    test('ライブラリが空の場合はゼロ値を返す', async () => {
      registerHandlers({ store, cacheManager: {} });
      const result = await handlers['get-statistics']({});
      expect(result.success).toBe(true);
      expect(result.data.totalGames).toBe(0);
      expect(result.data.totalPlaytimeMinutes).toBe(0);
    });
  });

  describe('get-recommendations handler', () => {
    test('タグプロファイルに基づくレコメンドを返す', async () => {
      const library = [
        createGame({ id: '1', tags: ['RPG'], playtimeMinutes: 3000 }),
      ];
      store.setLibrary(library);
      registerHandlers({ store, cacheManager: {} });

      const candidates = [
        createGame({ id: '10', tags: ['RPG'], reviewScore: 90, reviewCount: 1000 }),
        createGame({ id: '11', tags: ['Racing'], reviewScore: 80, reviewCount: 500 }),
      ];
      const result = await handlers['get-recommendations']({}, candidates);
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      // RPG がマッチするので上位
      expect(result.data[0].game.id).toBe('10');
    });
  });

  describe('createHandler', () => {
    test('成功時はデータを返す', async () => {
      const fn = jest.fn().mockResolvedValue({ data: [1, 2, 3] });
      const handler = createHandler(fn);
      const result = await handler({}, 'arg1');
      expect(result).toEqual({ success: true, data: { data: [1, 2, 3] }, error: null });
    });

    test('エラー時は error を返す', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('IPC fail'));
      const handler = createHandler(fn);
      const result = await handler({});
      expect(result.success).toBe(false);
      expect(result.error).toBe('IPC fail');
    });
  });
});
