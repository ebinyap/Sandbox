'use strict';

const { createGame } = require('../../src/engine/models');
const {
  aggregateTags,
  calculateTagRarity,
} = require('../../src/engine/tag-manager');

describe('tag-manager', () => {
  // --- aggregateTags ---
  describe('aggregateTags', () => {
    test('空配列は空オブジェクトを返す', () => {
      expect(aggregateTags([])).toEqual({});
    });

    test('1本のゲームのタグをカウントする', () => {
      const games = [
        createGame({ tags: ['RPG', 'Action'] }),
      ];
      expect(aggregateTags(games)).toEqual({ RPG: 1, Action: 1 });
    });

    test('複数ゲームでタグの出現回数を集計する', () => {
      const games = [
        createGame({ tags: ['RPG', 'Action'] }),
        createGame({ tags: ['RPG', 'Puzzle'] }),
        createGame({ tags: ['RPG', 'Action', 'Open World'] }),
      ];
      const result = aggregateTags(games);
      expect(result).toEqual({
        RPG: 3,
        Action: 2,
        Puzzle: 1,
        'Open World': 1,
      });
    });

    test('タグが空配列のゲームは無視される', () => {
      const games = [
        createGame({ tags: [] }),
        createGame({ tags: ['RPG'] }),
      ];
      expect(aggregateTags(games)).toEqual({ RPG: 1 });
    });
  });

  // --- calculateTagRarity ---
  describe('calculateTagRarity', () => {
    test('空配列は空オブジェクトを返す', () => {
      expect(calculateTagRarity([])).toEqual({});
    });

    test('全ゲームが持つタグの rarity は 0.0', () => {
      const games = [
        createGame({ tags: ['RPG'] }),
        createGame({ tags: ['RPG'] }),
        createGame({ tags: ['RPG'] }),
      ];
      const rarity = calculateTagRarity(games);
      expect(rarity.RPG).toBe(0);
    });

    test('1本のみが持つタグの rarity は最大値に近い', () => {
      const games = [
        createGame({ tags: ['RPG', 'Unique'] }),
        createGame({ tags: ['RPG'] }),
        createGame({ tags: ['RPG'] }),
      ];
      const rarity = calculateTagRarity(games);
      // 全ゲームが持つ RPG は 0
      expect(rarity.RPG).toBe(0);
      // 1本だけの Unique は高い rarity
      // 1 - (1/3) = 0.6667
      expect(rarity.Unique).toBeCloseTo(1 - 1 / 3, 4);
    });

    test('ゲームが1本だけの場合、全タグの rarity は 0', () => {
      const games = [
        createGame({ tags: ['RPG', 'Action'] }),
      ];
      const rarity = calculateTagRarity(games);
      expect(rarity.RPG).toBe(0);
      expect(rarity.Action).toBe(0);
    });

    test('rarity は 0.0 から 1.0 の範囲に収まる', () => {
      const games = [
        createGame({ tags: ['Common', 'Rare', 'Ultra'] }),
        createGame({ tags: ['Common', 'Rare'] }),
        createGame({ tags: ['Common'] }),
        createGame({ tags: ['Common'] }),
        createGame({ tags: ['Common'] }),
      ];
      const rarity = calculateTagRarity(games);
      for (const val of Object.values(rarity)) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
      // Common: 5/5 → rarity 0
      expect(rarity.Common).toBe(0);
      // Rare: 2/5 → rarity 0.6
      expect(rarity.Rare).toBeCloseTo(0.6, 4);
      // Ultra: 1/5 → rarity 0.8
      expect(rarity.Ultra).toBeCloseTo(0.8, 4);
    });
  });
});
