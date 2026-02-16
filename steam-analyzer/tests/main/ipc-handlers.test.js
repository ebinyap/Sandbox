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

  // --- 新規ハンドラー ---
  describe('refresh-library handler', () => {
    test('refresh-library を登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      const channels = ipcMain.handle.mock.calls.map((c) => c[0]);
      expect(channels).toContain('refresh-library');
    });

    test('fetcher を呼んでライブラリをマージ・保存する', async () => {
      const steamGames = [
        createGame({ id: '1', title: 'Skyrim', tags: ['RPG'], playtimeMinutes: 3000, sourceFlags: ['steam'] }),
      ];
      const fetcher = jest.fn().mockResolvedValue({ games: steamGames, errors: [] });
      registerHandlers({ store, cacheManager: {}, fetcher });
      const result = await handlers['refresh-library']({});
      expect(result.success).toBe(true);
      expect(result.data.games.length).toBe(1);
      expect(store.getLibrary().length).toBe(1);
      expect(store.getLibrary()[0].title).toBe('Skyrim');
    });

    test('fetcher が無い場合でもエラーにならない', async () => {
      registerHandlers({ store, cacheManager: {} });
      const result = await handlers['refresh-library']({});
      expect(result.success).toBe(true);
      expect(result.data.games).toEqual([]);
    });
  });

  describe('add-watchlist-entry handler', () => {
    test('add-watchlist-entry を登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      const channels = ipcMain.handle.mock.calls.map((c) => c[0]);
      expect(channels).toContain('add-watchlist-entry');
    });

    test('ウォッチリストにエントリを追加する', async () => {
      registerHandlers({ store, cacheManager: {} });
      const entry = { gameId: '1', title: 'Skyrim', targetPrice: 9.99 };
      const result = await handlers['add-watchlist-entry']({}, entry);
      expect(result.success).toBe(true);
      expect(store.getWatchlist().length).toBe(1);
      expect(store.getWatchlist()[0].gameId).toBe('1');
    });

    test('既存のウォッチリストに追加する', async () => {
      store.setWatchlist([{ gameId: '1', targetPrice: 9.99 }]);
      registerHandlers({ store, cacheManager: {} });
      const entry = { gameId: '2', title: 'Portal', targetPrice: 4.99 };
      await handlers['add-watchlist-entry']({}, entry);
      expect(store.getWatchlist().length).toBe(2);
    });

    test('同じ gameId の重複は追加しない', async () => {
      store.setWatchlist([{ gameId: '1', targetPrice: 9.99 }]);
      registerHandlers({ store, cacheManager: {} });
      const entry = { gameId: '1', targetPrice: 4.99 };
      await handlers['add-watchlist-entry']({}, entry);
      expect(store.getWatchlist().length).toBe(1);
    });
  });

  describe('remove-watchlist-entry handler', () => {
    test('remove-watchlist-entry を登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      const channels = ipcMain.handle.mock.calls.map((c) => c[0]);
      expect(channels).toContain('remove-watchlist-entry');
    });

    test('ウォッチリストからエントリを削除する', async () => {
      store.setWatchlist([
        { gameId: '1', targetPrice: 9.99 },
        { gameId: '2', targetPrice: 4.99 },
      ]);
      registerHandlers({ store, cacheManager: {} });
      const result = await handlers['remove-watchlist-entry']({}, '1');
      expect(result.success).toBe(true);
      expect(store.getWatchlist().length).toBe(1);
      expect(store.getWatchlist()[0].gameId).toBe('2');
    });
  });

  describe('get-activity-summary handler', () => {
    test('get-activity-summary を登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      const channels = ipcMain.handle.mock.calls.map((c) => c[0]);
      expect(channels).toContain('get-activity-summary');
    });

    test('アクティビティサマリーを返す', async () => {
      const activityMonitor = {
        getCompletedSessions: () => [
          { gameId: 'g1', startedAt: new Date('2024-01-05T10:00:00').getTime(), durationMinutes: 120 },
          { gameId: 'g1', startedAt: new Date('2024-02-10T10:00:00').getTime(), durationMinutes: 60 },
        ],
      };
      registerHandlers({ store, cacheManager: {}, activityMonitor });
      const result = await handlers['get-activity-summary']({});
      expect(result.success).toBe(true);
      expect(result.data.monthly).toBeDefined();
      expect(result.data.quarterly).toBeDefined();
      expect(result.data.yearly).toBeDefined();
      expect(result.data.monthly['2024-01'].totalMinutes).toBe(120);
    });

    test('activityMonitor が無い場合は空を返す', async () => {
      registerHandlers({ store, cacheManager: {} });
      const result = await handlers['get-activity-summary']({});
      expect(result.success).toBe(true);
      expect(result.data.monthly).toEqual({});
    });
  });

  describe('search-similar handler', () => {
    test('search-similar を登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      const channels = ipcMain.handle.mock.calls.map((c) => c[0]);
      expect(channels).toContain('search-similar');
    });

    test('指定ゲームに類似した候補をスコアリングする', async () => {
      const library = [
        createGame({ id: '1', title: 'Skyrim', tags: ['RPG', 'Open World'], playtimeMinutes: 3000 }),
        createGame({ id: '2', title: 'Portal', tags: ['Puzzle', 'FPS'], playtimeMinutes: 300 }),
      ];
      store.setLibrary(library);
      registerHandlers({ store, cacheManager: {} });

      const candidates = [
        createGame({ id: '10', tags: ['RPG', 'Open World'], reviewScore: 90 }),
        createGame({ id: '11', tags: ['Racing'], reviewScore: 80 }),
      ];
      const result = await handlers['search-similar']({}, '1', candidates);
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data[0].game.id).toBe('10');
    });
  });

  describe('get-sale-prediction handler', () => {
    test('get-sale-prediction を登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      const channels = ipcMain.handle.mock.calls.map((c) => c[0]);
      expect(channels).toContain('get-sale-prediction');
    });

    test('セール予測と購入アドバイスを返す', async () => {
      registerHandlers({ store, cacheManager: {} });
      const game = createGame({ id: '1', currentPrice: 59.99, basePrice: 59.99, historicalLow: 9.99 });
      const history = [
        { timestamp: 1000000, price: 30, cut: 50 },
        { timestamp: 2000000, price: 20, cut: 67 },
      ];
      const result = await handlers['get-sale-prediction']({}, game, history);
      expect(result.success).toBe(true);
      expect(result.data.prediction).toBeDefined();
      expect(result.data.advice).toBeDefined();
      expect(result.data.prediction.confidence).toBeDefined();
      expect(result.data.advice.verdict).toBeDefined();
    });
  });

  describe('clear-cache handler', () => {
    test('clear-cache を登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      const channels = ipcMain.handle.mock.calls.map((c) => c[0]);
      expect(channels).toContain('clear-cache');
    });

    test('キャッシュをクリアする', async () => {
      const cacheManager = { clear: jest.fn() };
      registerHandlers({ store, cacheManager });
      const result = await handlers['clear-cache']({});
      expect(result.success).toBe(true);
      expect(cacheManager.clear).toHaveBeenCalled();
    });
  });

  describe('export-data handler', () => {
    test('export-data を登録する', () => {
      registerHandlers({ store, cacheManager: {} });
      const channels = ipcMain.handle.mock.calls.map((c) => c[0]);
      expect(channels).toContain('export-data');
    });

    test('ライブラリとウォッチリストをJSON形式でエクスポートする', async () => {
      const games = [createGame({ id: '1', title: 'Skyrim' })];
      store.setLibrary(games);
      store.setWatchlist([{ gameId: '1', targetPrice: 9.99 }]);
      registerHandlers({ store, cacheManager: {} });
      const result = await handlers['export-data']({}, 'json');
      expect(result.success).toBe(true);
      expect(result.data.library).toBeDefined();
      expect(result.data.watchlist).toBeDefined();
      expect(result.data.library.length).toBe(1);
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
