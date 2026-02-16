'use strict';

/**
 * 価格バーコンポーネント (SEC-TAB-STORE)
 * ストアモードでゲームページ表示時に下部に表示
 */
(function () {
  window.PriceBar = {
    /**
     * @param {{ currentPrice, lowestPrice, lowestStore, historicalLow, nextSaleMonth, discountRange }} data
     * @returns {string} HTML
     */
    render(data) {
      if (!data) return '';
      const items = [];
      if (data.currentPrice != null) items.push(`<span>Current: $${data.currentPrice}</span>`);
      if (data.lowestPrice != null) items.push(`<span>Lowest Now: $${data.lowestPrice} (${data.lowestStore || '?'})</span>`);
      if (data.historicalLow != null) items.push(`<span>All-time Low: $${data.historicalLow}</span>`);
      if (data.nextSaleMonth) items.push(`<span>Next Sale: ~${data.nextSaleMonth}</span>`);

      return `<div style="display:flex;gap:16px;padding:8px 12px;background:#1b2838;border-top:1px solid #2a475e;font-size:13px;color:#8f98a0;">
        ${items.join('')}
      </div>`;
    },
  };
})();
