'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getLibrary: () => ipcRenderer.invoke('get-library'),
  getSettings: (key, defaultValue) => ipcRenderer.invoke('get-settings', key, defaultValue),
  setSettings: (key, value) => ipcRenderer.invoke('set-settings', key, value),
  getWatchlist: () => ipcRenderer.invoke('get-watchlist'),
  setWatchlist: (entries) => ipcRenderer.invoke('set-watchlist', entries),
  addWatchlistEntry: (entry) => ipcRenderer.invoke('add-watchlist-entry', entry),
  removeWatchlistEntry: (gameId) => ipcRenderer.invoke('remove-watchlist-entry', gameId),
  getBacklogAnalysis: () => ipcRenderer.invoke('get-backlog-analysis'),
  getStatistics: () => ipcRenderer.invoke('get-statistics'),
  getRecommendations: (candidates) => ipcRenderer.invoke('get-recommendations', candidates),
  refreshLibrary: () => ipcRenderer.invoke('refresh-library'),
  getActivitySummary: () => ipcRenderer.invoke('get-activity-summary'),
  searchSimilar: (sourceGameId, candidates) => ipcRenderer.invoke('search-similar', sourceGameId, candidates),
  getSalePrediction: (game, history) => ipcRenderer.invoke('get-sale-prediction', game, history),
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  exportData: (format) => ipcRenderer.invoke('export-data', format),
});
