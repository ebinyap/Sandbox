'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getLibrary: () => ipcRenderer.invoke('get-library'),
  getSettings: (key, defaultValue) => ipcRenderer.invoke('get-settings', key, defaultValue),
  setSettings: (key, value) => ipcRenderer.invoke('set-settings', key, value),
  getWatchlist: () => ipcRenderer.invoke('get-watchlist'),
  setWatchlist: (entries) => ipcRenderer.invoke('set-watchlist', entries),
  getBacklogAnalysis: () => ipcRenderer.invoke('get-backlog-analysis'),
  getStatistics: () => ipcRenderer.invoke('get-statistics'),
  getRecommendations: (candidates) => ipcRenderer.invoke('get-recommendations', candidates),
});
