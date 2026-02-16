'use strict';

/**
 * ストア/レコメンド統合タブ (SEC-TAB-STORE)
 * モード切り替え式: ストアモード（WebView自由ブラウジング）、レコメンドモード
 */
(function () {
  const panel = document.getElementById('tab-store-recommend');
  if (!panel) return;

  let mode = 'store'; // 'store' | 'recommend'
  let libraryGames = [];

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

  function renderGameCard(game, score, extras) {
    const price = game.currentPrice != null ? '$' + game.currentPrice.toFixed(2) : '--';
    const tags = (game.tags || []).slice(0, 3).map((t) => `<span style="background:#1b2838;border-radius:2px;padding:2px 6px;font-size:11px;">${t}</span>`).join(' ');
    return `
      <div style="background:#2a475e;border-radius:4px;padding:12px;">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <div>
            <strong>${game.title || game.id}</strong>
            ${score != null ? `<span style="margin-left:8px;color:#a4d007;font-size:12px;">Score: ${score.toFixed(1)}</span>` : ''}
          </div>
          <span style="color:#66c0f4;font-size:16px;">${price}</span>
        </div>
        ${tags ? `<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;">${tags}</div>` : ''}
        ${extras || ''}
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
      libraryGames = libResult.data;

      content.innerHTML = `
        <p style="color:#8f98a0;margin-bottom:12px;">${libraryGames.length} games in library. Recommendation engine ready.</p>
        <div style="margin-bottom:16px;">
          <h3 style="color:#8f98a0;margin-bottom:8px;">Find Similar Games</h3>
          <div style="display:flex;gap:8px;align-items:center;">
            <select id="similar-source" style="flex:1;padding:6px;background:#1b2838;border:1px solid #2a475e;color:#c7d5e0;border-radius:4px;">
              ${libraryGames.map((g) => `<option value="${g.id}">${g.title || g.id}</option>`).join('')}
            </select>
            <button id="btn-similar" style="padding:6px 12px;background:#1a9fff;border:none;color:#fff;border-radius:4px;cursor:pointer;">Search</button>
          </div>
          <div id="similar-results" style="margin-top:8px;"></div>
        </div>
        <div>
          <h3 style="color:#8f98a0;margin-bottom:8px;">Sale Prediction</h3>
          <div style="display:flex;gap:8px;align-items:center;">
            <select id="sale-source" style="flex:1;padding:6px;background:#1b2838;border:1px solid #2a475e;color:#c7d5e0;border-radius:4px;">
              ${libraryGames.map((g) => `<option value="${g.id}">${g.title || g.id}</option>`).join('')}
            </select>
            <button id="btn-sale" style="padding:6px 12px;background:#1a9fff;border:none;color:#fff;border-radius:4px;cursor:pointer;">Predict</button>
          </div>
          <div id="sale-results" style="margin-top:8px;"></div>
        </div>
      `;

      panel.querySelector('#btn-similar')?.addEventListener('click', searchSimilar);
      panel.querySelector('#btn-sale')?.addEventListener('click', predictSale);
    } catch (err) {
      content.innerHTML = `<div style="background:#4a1c1c;border:1px solid #8b3a3a;border-radius:4px;padding:12px;color:#e0a0a0;">Error: ${err.message}</div>`;
    }
  }

  async function searchSimilar() {
    const resultsEl = panel.querySelector('#similar-results');
    if (!resultsEl) return;
    const sourceId = panel.querySelector('#similar-source')?.value;
    if (!sourceId) return;

    resultsEl.innerHTML = '<p style="color:#8f98a0;">Searching...</p>';
    try {
      const candidates = libraryGames.filter((g) => g.id !== sourceId);
      const result = await window.api?.searchSimilar(sourceId, candidates);
      if (!result?.success || !result.data?.length) {
        resultsEl.innerHTML = '<p style="color:#8f98a0;">No similar games found.</p>';
        return;
      }
      const top5 = result.data.slice(0, 5);
      resultsEl.innerHTML = `<div style="display:grid;gap:6px;">${top5.map((r) => renderGameCard(r.game, r.score)).join('')}</div>`;
    } catch (err) {
      resultsEl.innerHTML = `<p style="color:#e0a0a0;">Error: ${err.message}</p>`;
    }
  }

  async function predictSale() {
    const resultsEl = panel.querySelector('#sale-results');
    if (!resultsEl) return;
    const sourceId = panel.querySelector('#sale-source')?.value;
    if (!sourceId) return;

    const game = libraryGames.find((g) => g.id === sourceId);
    if (!game) return;

    resultsEl.innerHTML = '<p style="color:#8f98a0;">Predicting...</p>';
    try {
      const result = await window.api?.getSalePrediction(game, game.priceHistory || []);
      if (!result?.success) {
        resultsEl.innerHTML = `<p style="color:#e0a0a0;">${result?.error || 'Prediction failed'}</p>`;
        return;
      }
      const { prediction, advice } = result.data;
      resultsEl.innerHTML = `
        <div style="background:#2a475e;border-radius:4px;padding:12px;">
          <strong>${game.title || game.id}</strong>
          ${prediction?.nextSaleMonth ? `<div style="margin-top:6px;color:#66c0f4;">Next sale: ~${prediction.nextSaleMonth}</div>` : ''}
          ${prediction?.confidence != null ? `<div style="font-size:12px;color:#8f98a0;margin-top:2px;">Confidence: ${(prediction.confidence * 100).toFixed(0)}%</div>` : ''}
          ${advice ? `<div style="margin-top:8px;padding:8px;background:#1b2838;border-radius:4px;font-size:13px;color:#c7d5e0;">${advice.recommendation || advice}</div>` : ''}
          <button class="btn-add-watch" data-gameid="${game.id}" data-title="${game.title || game.id}" style="margin-top:8px;padding:4px 10px;background:#2a475e;border:1px solid #66c0f4;color:#66c0f4;border-radius:4px;cursor:pointer;font-size:12px;">Add to Watchlist</button>
        </div>
      `;
      resultsEl.querySelector('.btn-add-watch')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        try {
          await window.api?.addWatchlistEntry({ gameId: btn.dataset.gameid, title: btn.dataset.title });
          btn.textContent = 'Added!';
          btn.disabled = true;
        } catch (_) { /* ignore */ }
      });
    } catch (err) {
      resultsEl.innerHTML = `<p style="color:#e0a0a0;">Error: ${err.message}</p>`;
    }
  }

  render();
})();
