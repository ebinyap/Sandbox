'use strict';

const { buildMonthlySummary, buildQuarterlySummary, buildYearlySummary } = require('../../src/engine/activity-analyzer');

describe('統合: アクティビティパイプライン', () => {
  // --- 月別 → 四半期 → 年別の一貫集計 ---
  describe('月別 → 四半期別 → 年別サマリーの一貫フロー', () => {
    const sessions = [
      // 2024年1月
      { gameId: 'g1', startedAt: new Date('2024-01-05T10:00:00').getTime(), durationMinutes: 120 },
      { gameId: 'g1', startedAt: new Date('2024-01-15T14:00:00').getTime(), durationMinutes: 60 },
      { gameId: 'g2', startedAt: new Date('2024-01-20T20:00:00').getTime(), durationMinutes: 90 },
      // 2024年2月
      { gameId: 'g1', startedAt: new Date('2024-02-10T10:00:00').getTime(), durationMinutes: 45 },
      // 2024年4月 (Q2)
      { gameId: 'g3', startedAt: new Date('2024-04-01T10:00:00').getTime(), durationMinutes: 200 },
      { gameId: 'g3', startedAt: new Date('2024-04-15T10:00:00').getTime(), durationMinutes: 150 },
      // 2024年7月 (Q3)
      { gameId: 'g1', startedAt: new Date('2024-07-01T10:00:00').getTime(), durationMinutes: 300 },
      // 2025年1月
      { gameId: 'g2', startedAt: new Date('2025-01-10T10:00:00').getTime(), durationMinutes: 180 },
    ];

    test('月別サマリーが正しく集計される', () => {
      const monthly = buildMonthlySummary(sessions);

      // 2024年1月: 3セッション、120+60+90=270分
      expect(monthly['2024-01']).toBeDefined();
      expect(monthly['2024-01'].totalMinutes).toBe(270);
      expect(monthly['2024-01'].sessionCount).toBe(3);
      expect(monthly['2024-01'].mostPlayed).toBe('g1'); // 180分 vs 90分

      // 2024年2月: 1セッション、45分
      expect(monthly['2024-02'].totalMinutes).toBe(45);
      expect(monthly['2024-02'].sessionCount).toBe(1);
    });

    test('月別→四半期別が一貫して集計される', () => {
      const monthly = buildMonthlySummary(sessions);
      const quarterly = buildQuarterlySummary(monthly);

      // Q1 2024: 1月(270) + 2月(45) = 315分, 4セッション
      expect(quarterly['2024-Q1']).toBeDefined();
      expect(quarterly['2024-Q1'].totalMinutes).toBe(315);
      expect(quarterly['2024-Q1'].sessionCount).toBe(4);

      // Q2 2024: 4月(350), 2セッション
      expect(quarterly['2024-Q2'].totalMinutes).toBe(350);
      expect(quarterly['2024-Q2'].sessionCount).toBe(2);

      // Q3 2024: 7月(300), 1セッション
      expect(quarterly['2024-Q3'].totalMinutes).toBe(300);
      expect(quarterly['2024-Q3'].sessionCount).toBe(1);

      // Q1 2025: 1月(180), 1セッション
      expect(quarterly['2025-Q1'].totalMinutes).toBe(180);
      expect(quarterly['2025-Q1'].sessionCount).toBe(1);
    });

    test('月別→年別が一貫して集計される', () => {
      const monthly = buildMonthlySummary(sessions);
      const yearly = buildYearlySummary(monthly);

      // 2024: 270+45+350+300 = 965分, 7セッション
      expect(yearly['2024']).toBeDefined();
      expect(yearly['2024'].totalMinutes).toBe(965);
      expect(yearly['2024'].sessionCount).toBe(7);

      // 2025: 180分, 1セッション
      expect(yearly['2025'].totalMinutes).toBe(180);
      expect(yearly['2025'].sessionCount).toBe(1);
    });

    test('四半期の合計と年の合計が一致する', () => {
      const monthly = buildMonthlySummary(sessions);
      const quarterly = buildQuarterlySummary(monthly);
      const yearly = buildYearlySummary(monthly);

      // 2024年の全四半期の合計 = 2024年の合計
      const q2024Total = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4']
        .filter((q) => quarterly[q])
        .reduce((sum, q) => sum + quarterly[q].totalMinutes, 0);

      expect(q2024Total).toBe(yearly['2024'].totalMinutes);
    });
  });

  // --- 空データの処理 ---
  describe('空データの一貫処理', () => {
    test('空セッションは空の月別・四半期・年別を返す', () => {
      const monthly = buildMonthlySummary([]);
      const quarterly = buildQuarterlySummary(monthly);
      const yearly = buildYearlySummary(monthly);

      expect(Object.keys(monthly).length).toBe(0);
      expect(Object.keys(quarterly).length).toBe(0);
      expect(Object.keys(yearly).length).toBe(0);
    });
  });
});
