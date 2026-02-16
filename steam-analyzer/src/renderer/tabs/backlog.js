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

  const STATUS_COLORS = {
    untouched: '#8f98a0',
    tasted: '#66c0f4',
    abandoned_early: '#e0a040',
    abandoned_mid: '#e07040',
    completed: '#a4d007',
    unknown: '#666',
  };

  function renderLoading() {
    panel.innerHTML = `
      <h2 style="margin-bottom:12px;">Backlog</h2>
      <p style="color:#8f98a0;">Loading...</p>
    `;
  }

  function renderError(message) {
    panel.innerHTML = `
      <h2 style="margin-bottom:12px;">Backlog</h2>
      <div style="background:#4a1c1c;border:1px solid #8b3a3a;border-radius:4px;padding:12px;color:#e0a0a0;">
        <p>Error: ${message}</p>
        <button id="backlog-retry" style="margin-top:8px;padding:4px 12px;background:#2a475e;border:none;color:#c7d5e0;border-radius:4px;cursor:pointer;">Retry</button>
      </div>
    `;
    panel.querySelector('#backlog-retry')?.addEventListener('click', load);
  }

  function renderData(analysis) {
    const { entries, summary } = analysis;
    const summaryHtml = Object.entries(summary.byStatus || {})
      .map(([status, count]) => `
        <div style="background:#2a475e;border-radius:4px;padding:8px 12px;display:flex;gap:8px;align-items:center;">
          <span style="color:${STATUS_COLORS[status] || '#8f98a0'};">${STATUS_LABELS[status] || status}</span>
          <span style="font-size:18px;">${count}</span>
        </div>
      `).join('');

    const rescueEntries = entries.filter((e) => e.rescuePriority > 0).slice(0, 10);
    const rescueHtml = rescueEntries.map((e) => {
      const pct = e.completionRate != null ? Math.round(e.completionRate * 100) + '%' : '--';
      const remaining = e.estimatedRemaining != null ? Math.round(e.estimatedRemaining / 60) + 'h left' : '';
      return `
        <div style="background:#2a475e;border-radius:4px;padding:10px 12px;display:grid;gap:4px;">
          <div style="display:flex;justify-content:space-between;">
            <strong>${e.game.title || e.game.id}</strong>
            <span style="color:${STATUS_COLORS[e.status]};">${STATUS_LABELS[e.status]}</span>
          </div>
          <div style="font-size:12px;color:#8f98a0;">
            Progress: ${pct} ${remaining ? '| ' + remaining : ''} | Priority: ${e.rescuePriority.toFixed(1)}
          </div>
          ${e.completionRate != null ? `
          <div style="background:#1b2838;border-radius:2px;height:4px;margin-top:2px;">
            <div style="background:#a4d007;height:100%;width:${Math.round(e.completionRate * 100)}%;border-radius:2px;"></div>
          </div>` : ''}
        </div>
      `;
    }).join('');

    panel.innerHTML = `
      <h2 style="margin-bottom:12px;">Backlog</h2>
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">${summaryHtml}</div>
      <div style="margin-bottom:8px;color:#8f98a0;font-size:12px;">Total: ${summary.total} games</div>
      ${rescueEntries.length > 0 ? `
      <h3 style="margin-bottom:8px;color:#8f98a0;">Rescue Priority</h3>
      <div style="display:grid;gap:6px;">${rescueHtml}</div>` : ''}
    `;
  }

  async function load() {
    renderLoading();
    try {
      const result = await window.api?.getBacklogAnalysis();
      if (!result || !result.success) {
        renderError(result?.error || 'Failed to load backlog');
        return;
      }
      renderData(result.data);
    } catch (err) {
      renderError(err.message);
    }
  }

  load();
})();
