'use strict';

const { ipcMain } = require('electron');
const { analyzeBacklog } = require('../engine/backlog-analyzer');
const { calculateCostPerHour, rankByCostEfficiency } = require('../engine/cost-analyzer');
const { calculateTagProfile, rankCandidates } = require('../engine/scorer');

/**
 * IPC ハンドラーのラッパー — 成功/エラーを統一フォーマットで返す
 * @param {Function} fn
 * @returns {Function}
 */
function createHandler(fn) {
  return async (event, ...args) => {
    try {
      const data = await fn(...args);
      return { success: true, data, error: null };
    } catch (err) {
      return { success: false, data: null, error: err.message };
    }
  };
}

/**
 * IPC ハンドラーを一括登録する
 * @param {{ store: object, cacheManager: object }} deps
 */
function registerHandlers(deps) {
  ipcMain.handle('get-library', createHandler(async () => {
    return deps.store.getLibrary();
  }));

  ipcMain.handle('get-settings', createHandler(async (key, defaultValue) => {
    return deps.store.getSetting(key, defaultValue);
  }));

  ipcMain.handle('set-settings', createHandler(async (key, value) => {
    deps.store.setSetting(key, value);
    return true;
  }));

  ipcMain.handle('get-watchlist', createHandler(async () => {
    return deps.store.getWatchlist();
  }));

  ipcMain.handle('set-watchlist', createHandler(async (entries) => {
    deps.store.setWatchlist(entries);
    return true;
  }));

  ipcMain.handle('get-backlog-analysis', createHandler(async () => {
    const games = deps.store.getLibrary();
    return analyzeBacklog(games);
  }));

  ipcMain.handle('get-statistics', createHandler(async () => {
    const games = deps.store.getLibrary();
    const totalGames = games.length;
    const totalPlaytimeMinutes = games.reduce((sum, g) => sum + (g.playtimeMinutes || 0), 0);
    const totalSpend = games.reduce((sum, g) => sum + (g.basePrice || 0), 0);
    const costRanking = rankByCostEfficiency(games);
    const avgCostPerHour = totalGames > 0
      ? costRanking.filter((e) => e.costPerHour != null && isFinite(e.costPerHour)).reduce((sum, e) => sum + e.costPerHour, 0) / (costRanking.filter((e) => e.costPerHour != null && isFinite(e.costPerHour)).length || 1)
      : 0;

    return {
      totalGames,
      totalPlaytimeMinutes,
      totalSpend,
      avgCostPerHour,
      costRanking,
    };
  }));

  ipcMain.handle('get-recommendations', createHandler(async (candidates) => {
    const library = deps.store.getLibrary();
    const profile = calculateTagProfile(library);
    return rankCandidates(candidates, profile, {});
  }));
}

module.exports = { registerHandlers, createHandler };
