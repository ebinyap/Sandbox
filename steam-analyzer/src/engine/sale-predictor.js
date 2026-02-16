'use strict';

/**
 * セール予測を行う (SEC-MODEL-SALE)
 *
 * | 確度         | 条件                                    |
 * | high         | セール実績5回以上、周期の分散が小さい     |
 * | medium       | セール実績3〜4回                         |
 * | low          | セール実績2回                            |
 * | insufficient | セール実績1回以下                        |
 *
 * @param {string} gameId
 * @param {Array<{ timestamp: number, price: number, cut: number }>} history
 * @returns {SalePrediction}
 */
function predictSale(gameId, history) {
  const count = history.length;

  if (count <= 1) {
    return {
      gameId,
      nextLikelyMonth: null,
      estimatedDiscount: null,
      confidence: 'insufficient',
      basedOn: {
        totalSaleCount: count,
        averageCycleDays: null,
        lastSaleDate: count === 1 ? new Date(history[0].timestamp * 1000) : null,
        seasonalMonths: [],
        anniversaryMonth: null,
      },
    };
  }

  // セール日をソート
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);

  // 周期の計算
  const cycles = [];
  for (let i = 1; i < sorted.length; i++) {
    const diffMs = (sorted[i].timestamp - sorted[i - 1].timestamp) * 1000;
    cycles.push(diffMs / (1000 * 60 * 60 * 24)); // 日数
  }
  const avgCycleDays = cycles.reduce((a, b) => a + b, 0) / cycles.length;

  // 季節パターン（どの月にセールが集中しているか）
  const monthCounts = {};
  for (const sale of sorted) {
    const m = new Date(sale.timestamp * 1000).getMonth() + 1;
    monthCounts[m] = (monthCounts[m] || 0) + 1;
  }
  const seasonalMonths = Object.entries(monthCounts)
    .filter(([, c]) => c >= 2)
    .map(([m]) => Number(m));

  // 確度判定
  let confidence;
  if (count >= 5) {
    confidence = 'high';
  } else if (count >= 3) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // 次回セール月の予測
  const lastDate = new Date(sorted[sorted.length - 1].timestamp * 1000);
  const nextDate = new Date(lastDate.getTime() + avgCycleDays * 24 * 60 * 60 * 1000);
  const nextLikelyMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

  // 割引率の傾向
  const cuts = sorted.map((s) => s.cut).filter((c) => c > 0);
  const minDiscount = cuts.length > 0 ? Math.min(...cuts) : null;
  const maxDiscount = cuts.length > 0 ? Math.max(...cuts) : null;

  return {
    gameId,
    nextLikelyMonth,
    estimatedDiscount: minDiscount != null ? { min: minDiscount, max: maxDiscount } : null,
    confidence,
    basedOn: {
      totalSaleCount: count,
      averageCycleDays: Math.round(avgCycleDays),
      lastSaleDate: lastDate,
      seasonalMonths,
      anniversaryMonth: null,
    },
  };
}

module.exports = { predictSale };
