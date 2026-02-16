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

const { ipcMain } = require('electron');
const { registerHandlers, createHandler } = require('../../src/main/ipc-handlers');

describe('ipc-handlers', () => {
  beforeEach(() => {
    ipcMain.handle.mockClear();
  });

  describe('registerHandlers', () => {
    test('複数の IPC ハンドラーを登録する', () => {
      const deps = { store: {}, cacheManager: {} };
      registerHandlers(deps);
      expect(ipcMain.handle).toHaveBeenCalled();
      expect(ipcMain.handle.mock.calls.length).toBeGreaterThanOrEqual(1);
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
