'use strict';

const { ipcMain } = require('electron');
const { analyzeBacklog } = require('../engine/backlog-analyzer');
const { calculateCostPerHour, rankByCostEfficiency } = require('../engine/cost-analyzer');
const { calculateTagProfile, rankCandidates, scoreSimilarCandidate } = require('../engine/scorer');
const { calculateTagRarity } = require('../engine/tag-manager');
const { mergeGames } = require('../engine/aggregator');
const { predictSale } = require('../engine/sale-predictor');
const { advise } = require('../engine/purchase-advisor');
const { buildMonthlySummary, buildQuarterlySummary, buildYearlySummary } = require('../engine/activity-analyzer');

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

  ipcMain.handle('refresh-library', createHandler(async () => {
    let result;
    if (deps.fetcher) {
      result = await deps.fetcher();
    } else if (deps.steamApi && deps.steamApi.fetchOwnedGames) {
      const apiKey = deps.store.getSetting('steamApiKey', '');
      const steamId = deps.store.getSetting('steamId', '');
      if (!apiKey || !steamId) {
        throw new Error('Steam API Key と Steam ID を設定してください');
      }
      result = await deps.steamApi.fetchOwnedGames(steamId, apiKey);
    } else {
      return { games: [], errors: [] };
    }
    const existingGames = deps.store.getLibrary();
    const merged = mergeGames([...existingGames, ...result.games]);
    deps.store.setLibrary(merged);
    return { games: merged, errors: result.errors };
  }));

  ipcMain.handle('add-watchlist-entry', createHandler(async (entry) => {
    const watchlist = deps.store.getWatchlist();
    const exists = watchlist.some((e) => e.gameId === entry.gameId);
    if (!exists) {
      watchlist.push(entry);
      deps.store.setWatchlist(watchlist);
    }
    return true;
  }));

  ipcMain.handle('remove-watchlist-entry', createHandler(async (gameId) => {
    const watchlist = deps.store.getWatchlist();
    const filtered = watchlist.filter((e) => e.gameId !== gameId);
    deps.store.setWatchlist(filtered);
    return true;
  }));

  ipcMain.handle('get-activity-summary', createHandler(async () => {
    const sessions = deps.activityMonitor
      ? deps.activityMonitor.getCompletedSessions()
      : [];
    const monthly = buildMonthlySummary(sessions);
    const quarterly = buildQuarterlySummary(monthly);
    const yearly = buildYearlySummary(monthly);
    return { monthly, quarterly, yearly };
  }));

  ipcMain.handle('search-similar', createHandler(async (sourceGameId, candidates) => {
    const library = deps.store.getLibrary();
    const sourceGame = library.find((g) => g.id === sourceGameId);
    if (!sourceGame) {
      return [];
    }
    const tagRarity = calculateTagRarity(library);
    const scored = candidates.map((c) => ({
      game: c,
      score: scoreSimilarCandidate(c, sourceGame, tagRarity, {}),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }));

  ipcMain.handle('get-sale-prediction', createHandler(async (game, history) => {
    const prediction = predictSale(game.id, history);
    const advice = advise(game, prediction);
    return { prediction, advice };
  }));

  ipcMain.handle('import-wishlist', createHandler(async () => {
    const steamId = deps.store.getSetting('steamId', '');
    if (!steamId) {
      throw new Error('Steam ID を設定してください');
    }
    if (!deps.steamApi || !deps.steamApi.fetchWishlist) {
      throw new Error('Steam API が利用できません');
    }
    const result = await deps.steamApi.fetchWishlist(steamId);
    const watchlist = deps.store.getWatchlist();
    let imported = 0;
    for (const item of result.items) {
      const exists = watchlist.some((e) => e.gameId === item.gameId);
      if (!exists) {
        watchlist.push(item);
        imported++;
      }
    }
    deps.store.setWatchlist(watchlist);
    return { imported, total: result.items.length, errors: result.errors };
  }));

  ipcMain.handle('clear-cache', createHandler(async () => {
    if (deps.cacheManager && typeof deps.cacheManager.clear === 'function') {
      deps.cacheManager.clear();
    }
    return true;
  }));

  ipcMain.handle('export-data', createHandler(async (format) => {
    const library = deps.store.getLibrary();
    const watchlist = deps.store.getWatchlist();
    return { library, watchlist, exportedAt: Date.now(), format: format || 'json' };
  }));
}

module.exports = { registerHandlers, createHandler };
