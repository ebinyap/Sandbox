'use strict';

const { createGame } = require('../../src/engine/models');

// electron-store のモック — インメモリ Map で代替
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

const Store = require('../../src/main/store');

describe('store', () => {
  let store;

  beforeEach(() => {
    store = new Store();
  });

  // --- ライブラリ保存/取得 ---
  describe('library', () => {
    test('初期状態ではライブラリは空配列', () => {
      expect(store.getLibrary()).toEqual([]);
    });

    test('ライブラリを保存して取得できる', () => {
      const games = [
        createGame({ id: '440', title: 'TF2' }),
        createGame({ id: '570', title: 'Dota 2' }),
      ];
      store.setLibrary(games);
      const result = store.getLibrary();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('440');
      expect(result[1].title).toBe('Dota 2');
    });
  });

  // --- TagProfile 保存/取得 ---
  describe('tagProfile', () => {
    test('初期状態では null', () => {
      expect(store.getTagProfile()).toBeNull();
    });

    test('TagProfile を保存して取得できる', () => {
      const profile = {
        weights: { RPG: 0.8, Action: 0.5 },
        source: { RPG: 'auto', Action: 'auto' },
        lastUpdated: Date.now(),
      };
      store.setTagProfile(profile);
      expect(store.getTagProfile()).toEqual(profile);
    });
  });

  // --- 設定値 ---
  describe('settings', () => {
    test('存在しない設定はデフォルト値を返す', () => {
      expect(store.getSetting('steamId', '')).toBe('');
    });

    test('設定を保存して取得できる', () => {
      store.setSetting('steamId', '76561198000000000');
      expect(store.getSetting('steamId')).toBe('76561198000000000');
    });
  });

  // --- ウォッチリスト ---
  describe('watchlist', () => {
    test('初期状態では空配列', () => {
      expect(store.getWatchlist()).toEqual([]);
    });

    test('ウォッチリストを保存して取得できる', () => {
      const entries = [{ gameId: '440', folderId: 'default' }];
      store.setWatchlist(entries);
      expect(store.getWatchlist()).toEqual(entries);
    });
  });
});
