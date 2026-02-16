'use strict';

/**
 * 購入タイミングアドバイスを生成する (SEC-MODEL-WATCH)
 *
 * verdict:
 *   - "buy_now"   — 歴代最安値に近い、買い時
 *   - "wait"      — セールが近い予測あり、待った方がいい
 *   - "expensive" — 現在価格がベース価格に近い、定価に近い
 *   - "unknown"   — 判定不能（価格データ不足）
 *
 * @param {Game} game
 * @param {{ confidence: string, nextLikelyMonth: string|null }} salePrediction
 * @returns {{ verdict: string, reasons: string[] }}
 */
function advise(game, salePrediction) {
  const reasons = [];

  // 価格データ不足
  if (game.currentPrice == null || game.basePrice == null) {
    return { verdict: 'unknown', reasons: ['価格データが不足しています'] };
  }

  const currentPrice = game.currentPrice;
  const basePrice = game.basePrice;
  const historicalLow = game.historicalLow;
  const discountFromBase = basePrice > 0 ? 1 - currentPrice / basePrice : 0;

  // 歴代最安値に近い → buy_now
  if (historicalLow != null && currentPrice <= historicalLow * 1.1) {
    reasons.push(`歴代最安値 $${historicalLow} に近い価格です`);
    return { verdict: 'buy_now', reasons };
  }

  // セールが近い → wait
  if (salePrediction.confidence !== 'insufficient' && salePrediction.nextLikelyMonth) {
    const now = new Date();
    const [year, month] = salePrediction.nextLikelyMonth.split('-').map(Number);
    const nextSale = new Date(year, month - 1);
    const daysUntilSale = (nextSale - now) / (1000 * 60 * 60 * 24);

    if (daysUntilSale <= 60 && daysUntilSale > 0) {
      reasons.push(`${salePrediction.nextLikelyMonth} にセールの可能性があります`);
      return { verdict: 'wait', reasons };
    }
  }

  // 定価に近い → expensive
  if (discountFromBase < 0.1) {
    reasons.push('現在価格が定価に近いです');
    if (historicalLow != null) {
      reasons.push(`歴代最安値は $${historicalLow} です`);
    }
    return { verdict: 'expensive', reasons };
  }

  // それ以外はセール中だが最安ではない
  reasons.push(`現在 ${Math.round(discountFromBase * 100)}% オフです`);
  if (historicalLow != null) {
    reasons.push(`歴代最安値は $${historicalLow} です`);
  }
  return { verdict: 'wait', reasons };
}

module.exports = { advise };
