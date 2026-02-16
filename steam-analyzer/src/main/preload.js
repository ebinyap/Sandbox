'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getLibrary: () => ipcRenderer.invoke('get-library'),
  getSettings: (key, defaultValue) => ipcRenderer.invoke('get-settings', key, defaultValue),
  setSettings: (key, value) => ipcRenderer.invoke('set-settings', key, value),
});
