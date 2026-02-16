'use strict';

const psList = require('ps-list');
const ElectronStore = require('electron-store');

/**
 * ActivityMonitor — プロセス監視、セッション管理 (SEC-ACTIVITY)
 *
 * ゲームプロセスの起動/終了を検知し、PlaySession を記録する。
 */
class ActivityMonitor {
  constructor() {
    this._store = new ElectronStore();
    this._mappings = [];      // ProcessMapping[]
    this._activeSessions = []; // { gameId, startedAt, endedAt, pid }
    this._completedSessions = this._store.get('completedSessions', []);
  }

  /**
   * プロセスマッピングを登録する
   * @param {{ installDir: string, appId: string, executablePaths: string[] }} mapping
   */
  registerMapping(mapping) {
    this._mappings.push(mapping);
  }

  getMappings() {
    return this._mappings;
  }

  /**
   * プロセスリストをスキャンして、ゲームの起動/終了を検出する
   */
  async scan() {
    const processes = await psList();
    const processNames = new Set(processes.map((p) => p.name));

    // 既知のゲーム実行ファイルを検索
    const detectedGameIds = new Set();
    for (const mapping of this._mappings) {
      for (const exe of mapping.executablePaths) {
        if (processNames.has(exe)) {
          detectedGameIds.add(mapping.appId);
          break;
        }
      }
    }

    // 新規セッション検出（前回になかったゲーム）
    const activeIds = new Set(this._activeSessions.map((s) => s.gameId));
    for (const gameId of detectedGameIds) {
      if (!activeIds.has(gameId)) {
        this._activeSessions.push({
          gameId,
          startedAt: Date.now(),
          endedAt: null,
          detectedBy: 'process',
        });
      }
    }

    // セッション終了検出（前回あったが今回ない）
    const toComplete = [];
    const stillActive = [];
    for (const session of this._activeSessions) {
      if (!detectedGameIds.has(session.gameId)) {
        const endedAt = Date.now();
        const durationMinutes = Math.round((endedAt - session.startedAt) / (60 * 1000));
        const completed = {
          gameId: session.gameId,
          startedAt: session.startedAt,
          endedAt,
          durationMinutes,
          detectedBy: session.detectedBy,
        };
        toComplete.push(completed);
      } else {
        stillActive.push(session);
      }
    }

    this._activeSessions = stillActive;
    this._completedSessions.push(...toComplete);

    if (toComplete.length > 0) {
      this._store.set('completedSessions', this._completedSessions);
    }
  }

  getActiveSessions() {
    return this._activeSessions;
  }

  getCompletedSessions() {
    return this._completedSessions;
  }
}

module.exports = ActivityMonitor;
