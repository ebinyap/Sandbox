'use strict';

/**
 * 設定タブ (SEC-TAB-SETTINGS)
 * APIキー、タグ重み手動調整、アクティビティ監視ON/OFF
 */
(function () {
  const panel = document.getElementById('tab-settings');
  if (!panel) return;

  async function render() {
    panel.innerHTML = `
      <h2 style="margin-bottom:12px;">Settings</h2>
      <div style="display:grid;gap:12px;max-width:500px;">
        <label style="display:block;">
          <span style="color:#8f98a0;font-size:12px;">Steam API Key</span>
          <input id="setting-steam-key" type="password" style="display:block;width:100%;padding:6px;margin-top:4px;background:#1b2838;border:1px solid #2a475e;color:#c7d5e0;border-radius:4px;">
        </label>
        <label style="display:block;">
          <span style="color:#8f98a0;font-size:12px;">Steam ID</span>
          <input id="setting-steam-id" type="text" style="display:block;width:100%;padding:6px;margin-top:4px;background:#1b2838;border:1px solid #2a475e;color:#c7d5e0;border-radius:4px;">
        </label>
        <label style="display:block;">
          <span style="color:#8f98a0;font-size:12px;">ITAD API Key</span>
          <input id="setting-itad-key" type="password" style="display:block;width:100%;padding:6px;margin-top:4px;background:#1b2838;border:1px solid #2a475e;color:#c7d5e0;border-radius:4px;">
        </label>
        <label style="display:flex;align-items:center;gap:8px;">
          <input id="setting-activity" type="checkbox">
          <span style="color:#8f98a0;font-size:13px;">Activity monitoring enabled</span>
        </label>
        <button id="setting-save" style="padding:8px 16px;background:#1a9fff;border:none;color:#fff;border-radius:4px;cursor:pointer;">Save</button>
      </div>
    `;
  }

  render();
})();
