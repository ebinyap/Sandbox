'use strict';

/**
 * 積みゲータブ (SEC-TAB-BACKLOG)
 * ステータス別の積みゲー一覧、救出優先度ランキング
 */
(function () {
  const panel = document.getElementById('tab-backlog');
  if (!panel) return;

  const STATUS_LABELS = {
    untouched: 'Untouched',
    tasted: 'Tasted',
    abandoned_early: 'Abandoned (Early)',
    abandoned_mid: 'Abandoned (Mid)',
    completed: 'Completed',
    unknown: 'Unknown',
  };

  async function render() {
    panel.innerHTML = `
      <h2 style="margin-bottom:12px;">Backlog</h2>
      <div id="backlog-summary" style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;"></div>
      <div id="backlog-list"></div>
    `;
  }

  render();
})();
