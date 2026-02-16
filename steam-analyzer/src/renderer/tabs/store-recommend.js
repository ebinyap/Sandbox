'use strict';

/**
 * ストア/レコメンド統合タブ (SEC-TAB-STORE)
 * モード切り替え式: ストアモード（WebView自由ブラウジング）、レコメンドモード
 */
(function () {
  const panel = document.getElementById('tab-store-recommend');
  if (!panel) return;

  let mode = 'store'; // 'store' | 'recommend' | 'similar'

  function render() {
    panel.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <button id="mode-store" style="padding:6px 12px;">Store</button>
        <button id="mode-recommend" style="padding:6px 12px;">Recommend</button>
      </div>
      <div id="store-content">
        ${mode === 'store' ? renderStoreMode() : renderRecommendMode()}
      </div>
    `;
    panel.querySelector('#mode-store')?.addEventListener('click', () => { mode = 'store'; render(); });
    panel.querySelector('#mode-recommend')?.addEventListener('click', () => { mode = 'recommend'; render(); });
  }

  function renderStoreMode() {
    return `<div style="background:#2a475e;border-radius:4px;padding:16px;text-align:center;color:#8f98a0;">
      <p>WebView: Steam Store</p>
      <p style="font-size:12px;margin-top:8px;">store.steampowered.com を表示</p>
    </div>`;
  }

  function renderRecommendMode() {
    return `<div style="background:#2a475e;border-radius:4px;padding:16px;text-align:center;color:#8f98a0;">
      <p>Recommend Mode</p>
      <p style="font-size:12px;margin-top:8px;">タグプロファイルに基づくレコメンド候補</p>
    </div>`;
  }

  render();
})();
