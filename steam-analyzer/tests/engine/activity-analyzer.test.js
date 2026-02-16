'use strict';

const {
  buildMonthlySummary,
  buildQuarterlySummary,
  buildYearlySummary,
} = require('../../src/engine/activity-analyzer');

// テスト用 PlaySession ヘルパー
function session(gameId, startStr, durationMinutes) {
  const startedAt = new Date(startStr).getTime();
  return {
    gameId,
    startedAt,
    endedAt: startedAt + durationMinutes * 60 * 1000,
    durationMinutes,
    detectedBy: 'process',
  };
}

describe('activity-analyzer', () => {
  const sessions = [
    session('440', '2026-01-05T10:00:00', 120),  // 1月 2h
    session('440', '2026-01-15T14:00:00', 60),   // 1月 1h
    session('570', '2026-01-20T18:00:00', 90),   // 1月 1.5h
    session('440', '2026-02-10T10:00:00', 180),  // 2月 3h
    session('570', '2026-04-01T10:00:00', 60),   // 4月（Q2）
  ];

  // --- buildMonthlySummary ---
  describe('buildMonthlySummary', () => {
    test('月別に totalMinutes と sessionCount を集計する', () => {
      const summary = buildMonthlySummary(sessions);
      expect(summary['2026-01'].totalMinutes).toBe(270); // 120 + 60 + 90
      expect(summary['2026-01'].sessionCount).toBe(3);
      expect(summary['2026-02'].totalMinutes).toBe(180);
      expect(summary['2026-02'].sessionCount).toBe(1);
    });

    test('ゲーム別の内訳が含まれる', () => {
      const summary = buildMonthlySummary(sessions);
      const jan = summary['2026-01'];
      const game440 = jan.games.find((g) => g.gameId === '440');
      expect(game440.minutes).toBe(180); // 120 + 60
      expect(game440.sessionCount).toBe(2);
    });

    test('mostPlayed が正しい', () => {
      const summary = buildMonthlySummary(sessions);
      expect(summary['2026-01'].mostPlayed).toBe('440');
    });

    test('空配列は空オブジェクトを返す', () => {
      expect(buildMonthlySummary([])).toEqual({});
    });
  });

  // --- buildQuarterlySummary ---
  describe('buildQuarterlySummary', () => {
    test('四半期別に集計する', () => {
      const monthly = buildMonthlySummary(sessions);
      const quarterly = buildQuarterlySummary(monthly);
      expect(quarterly['2026-Q1'].totalMinutes).toBe(450); // 270 + 180
      expect(quarterly['2026-Q2'].totalMinutes).toBe(60);
    });
  });

  // --- buildYearlySummary ---
  describe('buildYearlySummary', () => {
    test('年別に集計する', () => {
      const monthly = buildMonthlySummary(sessions);
      const yearly = buildYearlySummary(monthly);
      expect(yearly['2026'].totalMinutes).toBe(510); // 270 + 180 + 60
      expect(yearly['2026'].sessionCount).toBe(5);
    });
  });
});
