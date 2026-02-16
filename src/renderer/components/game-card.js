'use strict';

/**
 * ゲームカードコンポーネント（共通）
 * レコメンド、ウォッチリスト、積みゲー等で再利用
 */
(function () {
  window.GameCard = {
    /**
     * @param {{ title, tags, score, playtimeMinutes, currentPrice, status }} game
     * @returns {string} HTML
     */
    render(game) {
      const playtime = game.playtimeMinutes != null
        ? `${Math.round(game.playtimeMinutes / 60)}h`
        : '--';
      const price = game.currentPrice != null ? `$${game.currentPrice}` : '--';
      const tagsHtml = (game.tags || []).slice(0, 5)
        .map(t => `<span style="background:#1b2838;padding:2px 6px;border-radius:3px;font-size:11px;">${t}</span>`)
        .join(' ');

      return `<div style="background:#2a475e;border-radius:4px;padding:12px;display:grid;gap:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:14px;">${game.title || game.id}</strong>
          <span style="font-size:13px;color:#66c0f4;">${price}</span>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">${tagsHtml}</div>
        <div style="font-size:12px;color:#8f98a0;">Playtime: ${playtime}${game.score != null ? ` | Score: ${game.score.toFixed(1)}` : ''}</div>
      </div>`;
    },
  };
})();
