'use strict';

const { createGame } = require('../../src/engine/models');
const { calculateCostPerHour, rankByCostEfficiency } = require('../../src/engine/cost-analyzer');

describe('cost-analyzer', () => {
  describe('calculateCostPerHour', () => {
    test('プレイ時間と価格から1時間あたりコストを算出', () => {
      const game = createGame({ basePrice: 60, playtimeMinutes: 120 }); // 2時間
      expect(calculateCostPerHour(game)).toBeCloseTo(30, 1); // $60 / 2h = $30/h
    });

    test('プレイ時間 0 は Infinity を返す', () => {
      const game = createGame({ basePrice: 60, playtimeMinutes: 0 });
      expect(calculateCostPerHour(game)).toBe(Infinity);
    });

    test('価格 null は null を返す', () => {
      const game = createGame({ basePrice: null, playtimeMinutes: 120 });
      expect(calculateCostPerHour(game)).toBeNull();
    });

    test('F2P (価格0) は 0 を返す', () => {
      const game = createGame({ basePrice: 0, playtimeMinutes: 1000 });
      expect(calculateCostPerHour(game)).toBe(0);
    });
  });

  describe('rankByCostEfficiency', () => {
    test('コスパが良い順にソートされる', () => {
      const games = [
        createGame({ id: '1', basePrice: 60, playtimeMinutes: 60 }),   // $60/h
        createGame({ id: '2', basePrice: 10, playtimeMinutes: 600 }),  // $1/h
        createGame({ id: '3', basePrice: 30, playtimeMinutes: 120 }),  // $15/h
      ];
      const ranked = rankByCostEfficiency(games);
      expect(ranked[0].game.id).toBe('2'); // 最もコスパ良
      expect(ranked[1].game.id).toBe('3');
      expect(ranked[2].game.id).toBe('1');
    });

    test('価格不明のゲームは末尾に配置される', () => {
      const games = [
        createGame({ id: '1', basePrice: null, playtimeMinutes: 100 }),
        createGame({ id: '2', basePrice: 10, playtimeMinutes: 600 }),
      ];
      const ranked = rankByCostEfficiency(games);
      expect(ranked[0].game.id).toBe('2');
      expect(ranked[1].game.id).toBe('1');
    });
  });
});
