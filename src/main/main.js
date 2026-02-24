'use strict';

const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, shell, nativeImage } = require('electron');
const Store = require('./store');
const CacheManager = require('./cache-manager');
const ActivityMonitor = require('./activity-monitor');
const { registerHandlers } = require('./ipc-handlers');
const { createTray } = require('./tray');
const { fetchOwnedGames, fetchWishlist } = require('../api/steam');

const isE2E = process.argv.includes('--e2e');

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
    show: !isE2E, // E2Eではready-to-showまで非表示
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

  if (!isE2E) {
    mainWindow.on('close', (e) => {
      // トレイに最小化（閉じない）
      e.preventDefault();
      mainWindow.hide();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function getIconPath() {
  const iconFile = path.join(__dirname, '..', '..', 'assets', 'icon.png');
  if (fs.existsSync(iconFile)) return iconFile;
  return null;
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
  registerHandlers({ store, cacheManager, activityMonitor, steamApi: { fetchOwnedGames, fetchWishlist } });

  // ウィンドウ作成
  createWindow();

  // システムトレイ作成（E2Eモードではスキップ）
  if (!isE2E) {
    const iconPath = getIconPath();
    if (iconPath) {
      tray = createTray({
        iconPath,
        onShow: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
        onQuit: () => {
          stopActivityMonitor();
          if (mainWindow) mainWindow.destroy();
          app.quit();
        },
      });
    }

    // アクティビティモニター開始
    startActivityMonitor();
  }
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
  if (isE2E) {
    app.quit();
  }
  // 通常モード: トレイ常駐のため何もしない
});

module.exports = { store, cacheManager, activityMonitor, getMainWindow: () => mainWindow };
