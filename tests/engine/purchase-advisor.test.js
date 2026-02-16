'use strict';

const { createGame } = require('../../src/engine/models');
const { advise } = require('../../src/engine/purchase-advisor');

describe('purchase-advisor', () => {
  describe('advise', () => {
    test('歴代最安値に近い → "buy_now"', () => {
      const game = createGame({
        currentPrice: 5,
        historicalLow: 4.99,
        basePrice: 40,
      });
      const result = advise(game, { confidence: 'high', nextLikelyMonth: '2026-08' });
      expect(result.verdict).toBe('buy_now');
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    test('セールが近い予測 → "wait"', () => {
      const game = createGame({
        currentPrice: 30,
        historicalLow: 10,
        basePrice: 40,
      });
      const result = advise(game, {
        confidence: 'high',
        nextLikelyMonth: '2026-03', // 来月
      });
      expect(result.verdict).toBe('wait');
    });

    test('現在価格がベース価格に近い → "expensive"', () => {
      const game = createGame({
        currentPrice: 59,
        historicalLow: 15,
        basePrice: 60,
      });
      const result = advise(game, { confidence: 'low', nextLikelyMonth: null });
      expect(result.verdict).toBe('expensive');
    });

    test('価格データ不足 → verdict: "unknown"', () => {
      const game = createGame({
        currentPrice: null,
        historicalLow: null,
        basePrice: null,
      });
      const result = advise(game, { confidence: 'insufficient', nextLikelyMonth: null });
      expect(result.verdict).toBe('unknown');
    });

    test('結果に verdict と reasons が含まれる', () => {
      const game = createGame({ currentPrice: 20, historicalLow: 10, basePrice: 40 });
      const result = advise(game, { confidence: 'medium', nextLikelyMonth: '2026-06' });
      expect(result).toHaveProperty('verdict');
      expect(result).toHaveProperty('reasons');
      expect(Array.isArray(result.reasons)).toBe(true);
    });
  });
});
