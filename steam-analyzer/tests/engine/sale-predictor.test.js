'use strict';

const { predictSale } = require('../../src/engine/sale-predictor');

describe('sale-predictor', () => {
  describe('predictSale', () => {
    test('セール実績5回以上・周期安定 → confidence: high', () => {
      const history = [
        { timestamp: toUnix('2025-01-15'), price: 19.99, cut: 50 },
        { timestamp: toUnix('2025-04-10'), price: 14.99, cut: 62 },
        { timestamp: toUnix('2025-07-05'), price: 14.99, cut: 62 },
        { timestamp: toUnix('2025-10-01'), price: 9.99, cut: 75 },
        { timestamp: toUnix('2026-01-10'), price: 9.99, cut: 75 },
      ];
      const result = predictSale('440', history);
      expect(result.confidence).toBe('high');
      expect(result.nextLikelyMonth).not.toBeNull();
    });

    test('セール実績3〜4回 → confidence: medium', () => {
      const history = [
        { timestamp: toUnix('2025-06-15'), price: 19.99, cut: 50 },
        { timestamp: toUnix('2025-09-10'), price: 14.99, cut: 62 },
        { timestamp: toUnix('2026-01-05'), price: 14.99, cut: 62 },
      ];
      const result = predictSale('440', history);
      expect(result.confidence).toBe('medium');
    });

    test('セール実績2回 → confidence: low', () => {
      const history = [
        { timestamp: toUnix('2025-06-15'), price: 19.99, cut: 50 },
        { timestamp: toUnix('2026-01-10'), price: 14.99, cut: 62 },
      ];
      const result = predictSale('440', history);
      expect(result.confidence).toBe('low');
    });

    test('セール実績1回以下 → confidence: insufficient', () => {
      const result = predictSale('440', [
        { timestamp: toUnix('2025-06-15'), price: 19.99, cut: 50 },
      ]);
      expect(result.confidence).toBe('insufficient');
      expect(result.nextLikelyMonth).toBeNull();
    });

    test('空のセール履歴 → insufficient', () => {
      const result = predictSale('440', []);
      expect(result.confidence).toBe('insufficient');
    });

    test('basedOn にセール回数と周期情報が含まれる', () => {
      const history = [
        { timestamp: toUnix('2025-06-15'), price: 19.99, cut: 50 },
        { timestamp: toUnix('2025-09-10'), price: 14.99, cut: 62 },
        { timestamp: toUnix('2026-01-05'), price: 14.99, cut: 62 },
      ];
      const result = predictSale('440', history);
      expect(result.basedOn.totalSaleCount).toBe(3);
      expect(result.basedOn.averageCycleDays).toBeGreaterThan(0);
    });
  });
});

function toUnix(dateStr) {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}
