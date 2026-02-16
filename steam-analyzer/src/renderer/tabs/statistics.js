'use strict';

/**
 * 統計タブ (SEC-TAB-STATS)
 * プレイ時間、コスパ、アクティビティの統計情報を表示
 */
(function () {
  const panel = document.getElementById('tab-statistics');
  if (!panel) return;

  async function render() {
    panel.innerHTML = `
      <h2 style="margin-bottom:12px;">Statistics</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
        <div style="background:#2a475e;border-radius:4px;padding:16px;">
          <div style="color:#8f98a0;font-size:12px;">Total Games</div>
          <div id="stat-total" style="font-size:24px;margin-top:4px;">--</div>
        </div>
        <div style="background:#2a475e;border-radius:4px;padding:16px;">
          <div style="color:#8f98a0;font-size:12px;">Total Playtime</div>
          <div id="stat-playtime" style="font-size:24px;margin-top:4px;">--</div>
        </div>
        <div style="background:#2a475e;border-radius:4px;padding:16px;">
          <div style="color:#8f98a0;font-size:12px;">Avg Cost/Hour</div>
          <div id="stat-costhour" style="font-size:24px;margin-top:4px;">--</div>
        </div>
      </div>
    `;
  }

  render();
})();
