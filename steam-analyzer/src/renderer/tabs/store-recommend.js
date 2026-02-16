'use strict';

/**
 * ストア/レコメンド統合タブ (SEC-TAB-STORE)
 * モード切り替え式: ストアモード（WebView自由ブラウジング）、レコメンドモード
 */
(function () {
  const panel = document.getElementById('tab-store-recommend');
  if (!panel) return;

  let mode = 'store'; // 'store' | 'recommend'

  function render() {
    const storeActive = mode === 'store';
    panel.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <button id="mode-store" style="padding:6px 12px;background:${storeActive ? '#1a9fff' : '#2a475e'};border:none;color:#fff;border-radius:4px;cursor:pointer;">Store</button>
        <button id="mode-recommend" style="padding:6px 12px;background:${storeActive ? '#2a475e' : '#1a9fff'};border:none;color:#fff;border-radius:4px;cursor:pointer;">Recommend</button>
      </div>
      <div id="store-content"></div>
    `;
    panel.querySelector('#mode-store')?.addEventListener('click', () => { mode = 'store'; render(); });
    panel.querySelector('#mode-recommend')?.addEventListener('click', () => { mode = 'recommend'; loadRecommendations(); });

    if (mode === 'store') {
      renderStoreMode();
    }
  }

  function renderStoreMode() {
    const content = panel.querySelector('#store-content');
    if (!content) return;
    content.innerHTML = `<div style="background:#2a475e;border-radius:4px;padding:16px;text-align:center;color:#8f98a0;">
      <p>WebView: Steam Store</p>
      <p style="font-size:12px;margin-top:8px;">store.steampowered.com</p>
    </div>`;
  }

  async function loadRecommendations() {
    const content = panel.querySelector('#store-content');
    if (!content) return;
    content.innerHTML = '<p style="color:#8f98a0;">Loading recommendations...</p>';

    try {
      const libResult = await window.api?.getLibrary();
      if (!libResult?.success || !libResult.data?.length) {
        content.innerHTML = '<p style="color:#8f98a0;">Add your Steam API key and ID in Settings, then refresh your library to see recommendations.</p>';
        return;
      }
      content.innerHTML = `
        <p style="color:#8f98a0;">Recommendation engine ready. ${libResult.data.length} games in library.</p>
        <p style="font-size:12px;color:#666;margin-top:8px;">Candidates will be scored against your tag profile.</p>
      `;
    } catch (err) {
      content.innerHTML = `<div style="background:#4a1c1c;border:1px solid #8b3a3a;border-radius:4px;padding:12px;color:#e0a0a0;">Error: ${err.message}</div>`;
    }
  }

  render();
})();
