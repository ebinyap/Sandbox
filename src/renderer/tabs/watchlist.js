'use strict';

/**
 * ウォッチリストタブ (SEC-TAB-WATCH)
 * ウォッチリスト内ゲームの価格・セール情報を表示
 */
(function () {
  const panel = document.getElementById('tab-watchlist');
  if (!panel) return;

  function renderLoading() {
    panel.innerHTML = `
      <h2 style="margin-bottom:12px;">Watchlist</h2>
      <p style="color:#8f98a0;">Loading...</p>
    `;
  }

  function renderError(message) {
    panel.innerHTML = `
      <h2 style="margin-bottom:12px;">Watchlist</h2>
      <div style="background:#4a1c1c;border:1px solid #8b3a3a;border-radius:4px;padding:12px;color:#e0a0a0;">
        <p>Error: ${message}</p>
        <button id="watch-retry" style="margin-top:8px;padding:4px 12px;background:#2a475e;border:none;color:#c7d5e0;border-radius:4px;cursor:pointer;">Retry</button>
      </div>
    `;
    panel.querySelector('#watch-retry')?.addEventListener('click', load);
  }

  function renderEmpty() {
    panel.innerHTML = `
      <h2 style="margin-bottom:12px;">Watchlist</h2>
      <p style="color:#8f98a0;padding:16px;">Watchlist is empty. Add games from the Store tab.</p>
    `;
  }

  function renderData(items) {
    panel.innerHTML = `
      <h2 style="margin-bottom:12px;">Watchlist</h2>
      <div style="display:grid;gap:8px;">
        ${items.map(renderWatchItem).join('')}
      </div>
    `;
    panel.querySelectorAll('.watch-remove').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const gameId = btn.dataset.gameid;
        try {
          await window.api?.removeWatchlistEntry(gameId);
          load();
        } catch (_) { /* reload anyway */ load(); }
      });
    });
  }

  function renderWatchItem(item) {
    const price = item.currentPrice != null ? '$' + item.currentPrice : '--';
    const target = item.targetPrice != null ? '$' + item.targetPrice : '--';
    const atTarget = item.currentPrice != null && item.targetPrice != null && item.currentPrice <= item.targetPrice;

    return `<div style="background:#2a475e;border-radius:4px;padding:12px;display:flex;justify-content:space-between;align-items:center;${atTarget ? 'border-left:3px solid #a4d007;' : ''}">
      <div>
        <strong>${item.title || item.gameId || item.id}</strong>
        <div style="font-size:12px;color:#8f98a0;margin-top:2px;">Target: ${target}</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="text-align:right;">
          <div style="font-size:16px;color:${atTarget ? '#a4d007' : '#66c0f4'};">${price}</div>
          ${atTarget ? '<div style="font-size:11px;color:#a4d007;">Target reached!</div>' : ''}
        </div>
        <button class="watch-remove" data-gameid="${item.gameId || item.id}" style="padding:4px 8px;background:#4a1c1c;border:none;color:#e0a0a0;border-radius:4px;cursor:pointer;font-size:11px;">Remove</button>
      </div>
    </div>`;
  }

  async function load() {
    renderLoading();
    try {
      const result = await window.api?.getWatchlist();
      if (!result || !result.success) {
        renderError(result?.error || 'Failed to load watchlist');
        return;
      }
      if (result.data.length === 0) {
        renderEmpty();
        return;
      }
      renderData(result.data);
    } catch (err) {
      renderError(err.message);
    }
  }

  load();
})();
