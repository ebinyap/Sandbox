'use strict';

/**
 * 統計タブ (SEC-TAB-STATS)
 * プレイ時間、コスパ、アクティビティの統計情報を表示
 */
(function () {
  const panel = document.getElementById('tab-statistics');
  if (!panel) return;

  function renderLoading() {
    panel.innerHTML = `
      <h2 style="margin-bottom:12px;">Statistics</h2>
      <p style="color:#8f98a0;">Loading...</p>
    `;
  }

  function renderError(message) {
    panel.innerHTML = `
      <h2 style="margin-bottom:12px;">Statistics</h2>
      <div style="background:#4a1c1c;border:1px solid #8b3a3a;border-radius:4px;padding:12px;color:#e0a0a0;">
        <p>Error: ${message}</p>
        <button id="stats-retry" style="margin-top:8px;padding:4px 12px;background:#2a475e;border:none;color:#c7d5e0;border-radius:4px;cursor:pointer;">Retry</button>
      </div>
    `;
    panel.querySelector('#stats-retry')?.addEventListener('click', load);
  }

  function formatHours(minutes) {
    if (minutes == null) return '--';
    const h = Math.floor(minutes / 60);
    return h.toLocaleString() + 'h';
  }

  function formatCost(value) {
    if (value == null || !isFinite(value)) return '--';
    return '$' + value.toFixed(2);
  }

  function renderData(stats, activity) {
    const topCost = stats.costRanking
      .filter((e) => e.costPerHour != null && isFinite(e.costPerHour) && e.costPerHour > 0)
      .slice(0, 5);

    const yearlyEntries = activity ? Object.entries(activity.yearly).sort(([a], [b]) => b.localeCompare(a)) : [];
    const monthlyEntries = activity ? Object.entries(activity.monthly).sort(([a], [b]) => b.localeCompare(a)).slice(0, 6) : [];

    panel.innerHTML = `
      <h2 style="margin-bottom:12px;">Statistics</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px;">
        <div style="background:#2a475e;border-radius:4px;padding:16px;">
          <div style="color:#8f98a0;font-size:12px;">Total Games</div>
          <div style="font-size:24px;margin-top:4px;">${stats.totalGames}</div>
        </div>
        <div style="background:#2a475e;border-radius:4px;padding:16px;">
          <div style="color:#8f98a0;font-size:12px;">Total Playtime</div>
          <div style="font-size:24px;margin-top:4px;">${formatHours(stats.totalPlaytimeMinutes)}</div>
        </div>
        <div style="background:#2a475e;border-radius:4px;padding:16px;">
          <div style="color:#8f98a0;font-size:12px;">Total Spend</div>
          <div style="font-size:24px;margin-top:4px;">${formatCost(stats.totalSpend)}</div>
        </div>
        <div style="background:#2a475e;border-radius:4px;padding:16px;">
          <div style="color:#8f98a0;font-size:12px;">Avg Cost/Hour</div>
          <div style="font-size:24px;margin-top:4px;">${formatCost(stats.avgCostPerHour)}</div>
        </div>
      </div>
      ${topCost.length > 0 ? `
      <h3 style="margin-bottom:8px;color:#8f98a0;">Best Value Games</h3>
      <div style="display:grid;gap:6px;margin-bottom:16px;">
        ${topCost.map((e) => `
          <div style="background:#2a475e;border-radius:4px;padding:8px 12px;display:flex;justify-content:space-between;">
            <span>${e.game.title || e.game.id}</span>
            <span style="color:#a4d007;">${formatCost(e.costPerHour)}/h</span>
          </div>
        `).join('')}
      </div>` : ''}
      ${yearlyEntries.length > 0 ? `
      <h3 style="margin-bottom:8px;color:#8f98a0;">Activity by Year</h3>
      <div style="display:grid;gap:6px;margin-bottom:16px;">
        ${yearlyEntries.map(([year, data]) => `
          <div style="background:#2a475e;border-radius:4px;padding:8px 12px;display:flex;justify-content:space-between;">
            <span>${year}</span>
            <span style="color:#66c0f4;">${formatHours(data.totalMinutes)} | ${data.sessionCount} sessions</span>
          </div>
        `).join('')}
      </div>` : ''}
      ${monthlyEntries.length > 0 ? `
      <h3 style="margin-bottom:8px;color:#8f98a0;">Recent Monthly Activity</h3>
      <div style="display:grid;gap:6px;">
        ${monthlyEntries.map(([month, data]) => {
          const maxMinutes = Math.max(...monthlyEntries.map(([, d]) => d.totalMinutes), 1);
          const barWidth = Math.round((data.totalMinutes / maxMinutes) * 100);
          return `
          <div style="background:#2a475e;border-radius:4px;padding:8px 12px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>${month}</span>
              <span style="color:#66c0f4;">${formatHours(data.totalMinutes)}</span>
            </div>
            <div style="background:#1b2838;border-radius:2px;height:4px;">
              <div style="background:#66c0f4;height:100%;width:${barWidth}%;border-radius:2px;"></div>
            </div>
            <div style="font-size:11px;color:#8f98a0;margin-top:2px;">${data.sessionCount} sessions${data.mostPlayed ? ' | Most: ' + data.mostPlayed : ''}</div>
          </div>`;
        }).join('')}
      </div>` : ''}
    `;
  }

  async function load() {
    renderLoading();
    try {
      const [statsResult, activityResult] = await Promise.all([
        window.api?.getStatistics(),
        window.api?.getActivitySummary(),
      ]);
      if (!statsResult || !statsResult.success) {
        renderError(statsResult?.error || 'Failed to load statistics');
        return;
      }
      renderData(statsResult.data, activityResult?.success ? activityResult.data : null);
    } catch (err) {
      renderError(err.message);
    }
  }

  load();
})();
