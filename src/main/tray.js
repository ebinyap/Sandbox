'use strict';

const { Tray, Menu } = require('electron');

/**
 * システムトレイを初期化する
 * @param {{ iconPath: string, onShow: Function, onQuit: Function }} options
 * @returns {Tray}
 */
function createTray({ iconPath, onShow, onQuit }) {
  const tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Steam Analyzer を表示', click: onShow },
    { type: 'separator' },
    { label: '終了', click: onQuit },
  ]);

  tray.setToolTip('Steam Analyzer');
  tray.setContextMenu(contextMenu);

  return tray;
}

module.exports = { createTray };
