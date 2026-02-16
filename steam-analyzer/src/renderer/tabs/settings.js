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
      <hr style="border:none;border-top:1px solid #2a475e;margin:20px 0;">
      <h3 style="margin-bottom:12px;color:#8f98a0;">Data Management</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button id="setting-refresh" style="padding:8px 16px;background:#2a475e;border:none;color:#c7d5e0;border-radius:4px;cursor:pointer;">Refresh Library</button>
        <button id="setting-export" style="padding:8px 16px;background:#2a475e;border:none;color:#c7d5e0;border-radius:4px;cursor:pointer;">Export Data</button>
        <button id="setting-clear-cache" style="padding:8px 16px;background:#4a1c1c;border:none;color:#e0a0a0;border-radius:4px;cursor:pointer;">Clear Cache</button>
      </div>
      <div id="data-status" style="margin-top:8px;font-size:12px;color:#8f98a0;display:none;"></div>
    `;

    panel.querySelector('#setting-save')?.addEventListener('click', save);
    panel.querySelector('#setting-refresh')?.addEventListener('click', refreshLibrary);
    panel.querySelector('#setting-export')?.addEventListener('click', exportData);
    panel.querySelector('#setting-clear-cache')?.addEventListener('click', clearCache);
  }

  function showDataStatus(msg, isError) {
    const el = panel.querySelector('#data-status');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? '#e0a0a0' : '#a4d007';
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }

  async function refreshLibrary() {
    const btn = panel.querySelector('#setting-refresh');
    if (btn) btn.disabled = true;
    showDataStatus('Refreshing library...', false);
    try {
      const result = await window.api?.refreshLibrary();
      if (result?.success) {
        const count = result.data?.games?.length || 0;
        showDataStatus(`Library refreshed: ${count} games`, false);
      } else {
        showDataStatus(result?.error || 'Refresh failed', true);
      }
    } catch (err) {
      showDataStatus('Refresh failed: ' + err.message, true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function exportData() {
    try {
      const result = await window.api?.exportData('json');
      if (result?.success) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'steam-analyzer-export.json';
        a.click();
        URL.revokeObjectURL(url);
        showDataStatus('Data exported', false);
      } else {
        showDataStatus(result?.error || 'Export failed', true);
      }
    } catch (err) {
      showDataStatus('Export failed: ' + err.message, true);
    }
  }

  async function clearCache() {
    try {
      const result = await window.api?.clearCache();
      if (result?.success) {
        showDataStatus('Cache cleared', false);
      } else {
        showDataStatus(result?.error || 'Clear failed', true);
      }
    } catch (err) {
      showDataStatus('Clear failed: ' + err.message, true);
    }
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
