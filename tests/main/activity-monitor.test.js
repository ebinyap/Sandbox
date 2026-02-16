'use strict';

// ps-list モック
jest.mock('ps-list', () => jest.fn(), { virtual: true });

// electron-store モック
jest.mock('electron-store', () => {
  return class MockStore {
    constructor() { this._data = new Map(); }
    get(key, def) { return this._data.has(key) ? this._data.get(key) : def; }
    set(key, val) { this._data.set(key, val); }
  };
}, { virtual: true });

const psList = require('ps-list');
const ActivityMonitor = require('../../src/main/activity-monitor');

describe('activity-monitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new ActivityMonitor();
    // ゲームのプロセスマッピングを登録
    monitor.registerMapping({ installDir: 'Team Fortress 2', appId: '440', executablePaths: ['hl2.exe'] });
    monitor.registerMapping({ installDir: 'Dota 2', appId: '570', executablePaths: ['dota2.exe'] });
    jest.spyOn(Date, 'now');
    Date.now.mockReturnValue(1000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('scan', () => {
    test('新しいゲームプロセスを検出するとセッションを開始する', async () => {
      psList.mockResolvedValueOnce([
        { name: 'hl2.exe', pid: 1234 },
        { name: 'chrome.exe', pid: 5678 },
      ]);

      await monitor.scan();
      const active = monitor.getActiveSessions();
      expect(active).toHaveLength(1);
      expect(active[0].gameId).toBe('440');
      expect(active[0].endedAt).toBeNull();
    });

    test('プロセスが消失するとセッションを終了する', async () => {
      psList.mockResolvedValueOnce([{ name: 'hl2.exe', pid: 1234 }]);
      await monitor.scan();

      Date.now.mockReturnValue(1000000 + 60 * 60 * 1000); // 1時間後
      psList.mockResolvedValueOnce([]); // プロセスなし
      await monitor.scan();

      const active = monitor.getActiveSessions();
      expect(active).toHaveLength(0);

      const completed = monitor.getCompletedSessions();
      expect(completed).toHaveLength(1);
      expect(completed[0].gameId).toBe('440');
      expect(completed[0].durationMinutes).toBe(60);
    });

    test('ゲーム以外のプロセスは無視する', async () => {
      psList.mockResolvedValueOnce([
        { name: 'chrome.exe', pid: 1 },
        { name: 'slack.exe', pid: 2 },
      ]);

      await monitor.scan();
      expect(monitor.getActiveSessions()).toHaveLength(0);
    });

    test('複数ゲームの同時実行を検出する', async () => {
      psList.mockResolvedValueOnce([
        { name: 'hl2.exe', pid: 1 },
        { name: 'dota2.exe', pid: 2 },
      ]);

      await monitor.scan();
      expect(monitor.getActiveSessions()).toHaveLength(2);
    });
  });

  describe('registerMapping', () => {
    test('新しいマッピングを追加できる', () => {
      monitor.registerMapping({ installDir: 'Hades', appId: '1145360', executablePaths: ['Hades.exe'] });
      expect(monitor.getMappings()).toHaveLength(3);
    });
  });
});
