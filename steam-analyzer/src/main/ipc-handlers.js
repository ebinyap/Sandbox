'use strict';

const { ipcMain } = require('electron');

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
}

module.exports = { registerHandlers, createHandler };
