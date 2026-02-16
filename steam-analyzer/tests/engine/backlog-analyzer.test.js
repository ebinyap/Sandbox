'use strict';

const { createGame } = require('../../src/engine/models');
const {
  classifyStatus,
  calculateRescuePriority,
  analyzeBacklog,
} = require('../../src/engine/backlog-analyzer');

describe('backlog-analyzer', () => {
  // --- classifyStatus ---
  describe('classifyStatus', () => {
    test('プレイ時間 0 → untouched', () => {
      const game = createGame({ playtimeMinutes: 0, hltbMain: 600 });
      expect(classifyStatus(game)).toBe('untouched');
    });

    test('プレイ時間 null → untouched', () => {
      const game = createGame({ playtimeMinutes: null, hltbMain: 600 });
      expect(classifyStatus(game)).toBe('untouched');
    });

    test('プレイ時間 1〜30分 → tasted', () => {
      const game = createGame({ playtimeMinutes: 15, hltbMain: 600 });
      expect(classifyStatus(game)).toBe('tasted');
    });

    test('プレイ時間 30分、HLTB 20%未満 → abandoned_early', () => {
      // HLTB = 600分 → 20% = 120分。40分 < 120分 → abandoned_early
      const game = createGame({ playtimeMinutes: 40, hltbMain: 600 });
      expect(classifyStatus(game)).toBe('abandoned_early');
    });

    test('プレイ時間 HLTB 20%〜70% → abandoned_mid', () => {
      // HLTB = 600分 → 20% = 120, 70% = 420。200分 → abandoned_mid
      const game = createGame({ playtimeMinutes: 200, hltbMain: 600 });
      expect(classifyStatus(game)).toBe('abandoned_mid');
    });

    test('プレイ時間 HLTB 70%以上 → completed', () => {
      // HLTB = 600分 → 70% = 420。500分 → completed
      const game = createGame({ playtimeMinutes: 500, hltbMain: 600 });
      expect(classifyStatus(game)).toBe('completed');
    });

    test('HLTB データなし、プレイ時間 > 30分 → unknown', () => {
      const game = createGame({ playtimeMinutes: 200, hltbMain: null });
      expect(classifyStatus(game)).toBe('unknown');
    });
  });

  // --- calculateRescuePriority ---
  describe('calculateRescuePriority', () => {
    test('abandoned のゲームは untouched より高い優先度', () => {
      const abandoned = createGame({ playtimeMinutes: 200, hltbMain: 600, basePrice: 60 });
      const untouched = createGame({ playtimeMinutes: 0, hltbMain: 600, basePrice: 60 });
      expect(calculateRescuePriority(abandoned)).toBeGreaterThan(calculateRescuePriority(untouched));
    });

    test('高価なゲームほど優先度が高い', () => {
      const expensive = createGame({ playtimeMinutes: 100, hltbMain: 600, basePrice: 60 });
      const cheap = createGame({ playtimeMinutes: 100, hltbMain: 600, basePrice: 5 });
      expect(calculateRescuePriority(expensive)).toBeGreaterThan(calculateRescuePriority(cheap));
    });

    test('completed のゲームは優先度 0', () => {
      const game = createGame({ playtimeMinutes: 500, hltbMain: 600, basePrice: 60 });
      expect(calculateRescuePriority(game)).toBe(0);
    });
  });

  // --- analyzeBacklog ---
  describe('analyzeBacklog', () => {
    test('空配列は空の結果を返す', () => {
      const result = analyzeBacklog([]);
      expect(result.entries).toEqual([]);
      expect(result.summary.total).toBe(0);
    });

    test('各ゲームを BacklogEntry に変換する', () => {
      const games = [
        createGame({ id: '1', playtimeMinutes: 0, hltbMain: 600, basePrice: 30 }),
        createGame({ id: '2', playtimeMinutes: 500, hltbMain: 600, basePrice: 60 }),
      ];
      const result = analyzeBacklog(games);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].status).toBe('untouched');
      expect(result.entries[1].status).toBe('completed');
    });

    test('summary にステータスごとの件数が含まれる', () => {
      const games = [
        createGame({ id: '1', playtimeMinutes: 0, hltbMain: 600 }),
        createGame({ id: '2', playtimeMinutes: 0, hltbMain: 300 }),
        createGame({ id: '3', playtimeMinutes: 500, hltbMain: 600 }),
      ];
      const result = analyzeBacklog(games);
      expect(result.summary.total).toBe(3);
      expect(result.summary.byStatus.untouched).toBe(2);
      expect(result.summary.byStatus.completed).toBe(1);
    });

    test('entries は rescuePriority 降順でソートされる', () => {
      const games = [
        createGame({ id: '1', playtimeMinutes: 500, hltbMain: 600, basePrice: 60 }), // completed = 0
        createGame({ id: '2', playtimeMinutes: 200, hltbMain: 600, basePrice: 60 }), // abandoned = 高
        createGame({ id: '3', playtimeMinutes: 0, hltbMain: 600, basePrice: 5 }),     // untouched = 低
      ];
      const result = analyzeBacklog(games);
      expect(result.entries[0].game.id).toBe('2');
    });
  });
});
