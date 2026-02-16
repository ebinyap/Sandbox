'use strict';

const path = require('path');
const { app, BrowserWindow, shell } = require('electron');
const Store = require('./store');
const CacheManager = require('./cache-manager');
const ActivityMonitor = require('./activity-monitor');
const { registerHandlers } = require('./ipc-handlers');
const { createTray } = require('./tray');

let mainWindow = null;
let tray = null;
let activityScanInterval = null;

const store = new Store();
const cacheManager = new CacheManager();
const activityMonitor = new ActivityMonitor();

const ACTIVITY_SCAN_INTERVAL_MS = 60 * 1000; // 1分

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Steam Analyzer',
    backgroundColor: '#1b2838',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // 外部リンクは既定ブラウザで開く (SEC-EXTLINK)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (e) => {
    // トレイに最小化（閉じない）
    e.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startActivityMonitor() {
  const enabled = store.getSetting('activityMonitorEnabled', false);
  if (!enabled) return;

  activityScanInterval = setInterval(() => {
    activityMonitor.scan().catch((err) => {
      console.error('[ActivityMonitor] scan error:', err.message);
    });
  }, ACTIVITY_SCAN_INTERVAL_MS);
}

function stopActivityMonitor() {
  if (activityScanInterval) {
    clearInterval(activityScanInterval);
    activityScanInterval = null;
  }
}

app.whenReady().then(() => {
  // IPC ハンドラー登録
  registerHandlers({ store, cacheManager });

  // ウィンドウ作成
  createWindow();

  // システムトレイ作成
  tray = createTray({
    iconPath: path.join(__dirname, '..', '..', 'assets', 'icon.png'),
    onShow: () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    onQuit: () => {
      stopActivityMonitor();
      mainWindow.destroy();
      app.quit();
    },
  });

  // アクティビティモニター開始
  startActivityMonitor();
});

// macOS: Dock クリックでウィンドウ再表示
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

// 全ウィンドウ閉じてもアプリ終了しない（トレイ常駐）
app.on('window-all-closed', () => {
  // トレイ常駐のため何もしない
});

module.exports = { store, cacheManager, activityMonitor };
