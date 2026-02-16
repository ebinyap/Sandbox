'use strict';

/**
 * ウォッチリストタブ (SEC-TAB-WATCH)
 * ウォッチリスト内ゲームの価格・セール情報を表示
 */
(function () {
  const panel = document.getElementById('tab-watchlist');
  if (!panel) return;

  async function render() {
    const result = await window.api?.invoke('get-watchlist');
    const items = result?.success ? result.data : [];

    if (items.length === 0) {
      panel.innerHTML = '<p style="color:#8f98a0;padding:16px;">ウォッチリストは空です。ストアタブからゲームを追加してください。</p>';
      return;
    }

    panel.innerHTML = `<div style="display:grid;gap:8px;">${items.map(renderWatchItem).join('')}</div>`;
  }

  function renderWatchItem(item) {
    return `<div class="game-card" style="background:#2a475e;border-radius:4px;padding:12px;">
      <strong>${item.title || item.id}</strong>
    </div>`;
  }

  render();
})();
