'use strict';

/**
 * 設定タブ (SEC-TAB-SETTINGS)
 * APIキー、タグ重み手動調整、アクティビティ監視ON/OFF
 */
(function () {
  const panel = document.getElementById('tab-settings');
  if (!panel) return;

  function renderForm() {
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
        <div style="display:flex;gap:8px;align-items:center;">
          <button id="setting-save" style="padding:8px 16px;background:#1a9fff;border:none;color:#fff;border-radius:4px;cursor:pointer;">Save</button>
          <span id="setting-status" style="font-size:12px;color:#a4d007;display:none;"></span>
        </div>
      </div>
    `;

    panel.querySelector('#setting-save')?.addEventListener('click', save);
  }

  async function loadSettings() {
    renderForm();
    try {
      const keys = ['steamApiKey', 'steamId', 'itadApiKey', 'activityMonitorEnabled'];
      for (const key of keys) {
        const result = await window.api?.getSettings(key, '');
        if (result?.success) {
          const el = panel.querySelector({
            steamApiKey: '#setting-steam-key',
            steamId: '#setting-steam-id',
            itadApiKey: '#setting-itad-key',
            activityMonitorEnabled: '#setting-activity',
          }[key]);
          if (el) {
            if (el.type === 'checkbox') {
              el.checked = !!result.data;
            } else {
              el.value = result.data || '';
            }
          }
        }
      }
    } catch (err) {
      // Settings load failure is non-fatal
    }
  }

  async function save() {
    const status = panel.querySelector('#setting-status');
    try {
      await window.api?.setSettings('steamApiKey', panel.querySelector('#setting-steam-key')?.value || '');
      await window.api?.setSettings('steamId', panel.querySelector('#setting-steam-id')?.value || '');
      await window.api?.setSettings('itadApiKey', panel.querySelector('#setting-itad-key')?.value || '');
      await window.api?.setSettings('activityMonitorEnabled', panel.querySelector('#setting-activity')?.checked || false);

      if (status) {
        status.textContent = 'Saved!';
        status.style.display = 'inline';
        setTimeout(() => { status.style.display = 'none'; }, 2000);
      }
    } catch (err) {
      if (status) {
        status.textContent = 'Save failed: ' + err.message;
        status.style.color = '#e0a0a0';
        status.style.display = 'inline';
      }
    }
  }

  loadSettings();
})();
