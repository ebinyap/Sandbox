'use strict';

const { createGame } = require('../../src/engine/models');
const { analyzeBacklog, classifyStatus } = require('../../src/engine/backlog-analyzer');
const { calculateCostPerHour, rankByCostEfficiency } = require('../../src/engine/cost-analyzer');
const { predictSale } = require('../../src/engine/sale-predictor');
const { advise } = require('../../src/engine/purchase-advisor');
const { mergeGames } = require('../../src/engine/aggregator');

describe('統合: 分析パイプライン', () => {
  // --- 積みゲー分析 + コスパ分析 ---
  describe('積みゲー分析 → コスパ分析の横断', () => {
    const library = [
      createGame({ id: '1', title: 'Skyrim', playtimeMinutes: 6000, hltbMain: 600, basePrice: 39.99 }),
      createGame({ id: '2', title: 'Witcher 3', playtimeMinutes: 200, hltbMain: 3000, basePrice: 49.99 }),
      createGame({ id: '3', title: 'Indie Game', playtimeMinutes: 0, hltbMain: 300, basePrice: 14.99 }),
      createGame({ id: '4', title: 'Short Game', playtimeMinutes: 5, hltbMain: 120, basePrice: 9.99 }),
      createGame({ id: '5', title: 'Free Game', playtimeMinutes: 600, hltbMain: 600, basePrice: 0 }),
    ];

    test('積みゲー分析で分類されたゲームのコスパも算出できる', () => {
      const backlog = analyzeBacklog(library);

      // 分類確認
      const statusMap = {};
      for (const entry of backlog.entries) {
        statusMap[entry.game.id] = entry.status;
      }
      expect(statusMap['1']).toBe('completed');    // 6000/600 = 10.0 >= 0.7
      expect(statusMap['2']).toBe('abandoned_early'); // 200/3000 = 0.067 < 0.2
      expect(statusMap['3']).toBe('untouched');     // 0分
      expect(statusMap['4']).toBe('tasted');        // 5分 <= 30分

      // コスパ分析との組み合わせ
      const costRanking = rankByCostEfficiency(library);

      // Free Game (cost=0) が最もコスパ良い
      expect(costRanking[0].game.id).toBe('5');
      expect(costRanking[0].costPerHour).toBe(0);

      // Skyrim は 39.99 / (6000/60) = 0.4 $/h と良コスパ
      const skyrimEntry = costRanking.find((e) => e.game.id === '1');
      expect(skyrimEntry.costPerHour).toBeCloseTo(0.4, 1);

      // Indie Game (0分) は Infinity
      const indieEntry = costRanking.find((e) => e.game.id === '3');
      expect(indieEntry.costPerHour).toBe(Infinity);
    });

    test('積みゲーの無駄遣い額とコスパが相関する', () => {
      const backlog = analyzeBacklog(library);
      const costRanking = rankByCostEfficiency(library);

      // abandoned/untouched のゲームは wastedSpend が非null
      const abandonedEntries = backlog.entries.filter((e) =>
        e.status !== 'completed' && e.game.basePrice > 0
      );
      expect(abandonedEntries.length).toBeGreaterThan(0);

      for (const entry of abandonedEntries) {
        expect(entry.wastedSpend).toBe(entry.game.basePrice);
        // コスパも悪いはず（プレイ時間少ない or 0）
        const costEntry = costRanking.find((c) => c.game.id === entry.game.id);
        expect(costEntry.costPerHour).toBeGreaterThan(1);
      }
    });
  });

  // --- セール予測 → 購入アドバイス ---
  describe('セール予測 → 購入アドバイスの一貫フロー', () => {
    test('セール実績が多いゲームは wait を推奨する', () => {
      // 約90日周期でセールするゲーム
      const now = Date.now() / 1000;
      const history = [
        { timestamp: now - 360 * 86400, price: 29.99, cut: 50 },
        { timestamp: now - 270 * 86400, price: 24.99, cut: 58 },
        { timestamp: now - 180 * 86400, price: 19.99, cut: 67 },
        { timestamp: now - 90 * 86400, price: 14.99, cut: 75 },
        { timestamp: now - 10 * 86400, price: 12.99, cut: 78 },
      ];

      const prediction = predictSale('game1', history);
      expect(prediction.confidence).toBe('high');

      // 現在価格が定価に近い状態で購入アドバイス
      const game = createGame({
        id: 'game1',
        currentPrice: 59.99,
        basePrice: 59.99,
        historicalLow: 12.99,
      });

      const advice = advise(game, prediction);
      // 定価に近い → expensive
      expect(advice.verdict).toBe('expensive');
      expect(advice.reasons.length).toBeGreaterThan(0);
    });

    test('歴代最安値に近い場合は buy_now を推奨する', () => {
      const prediction = predictSale('game2', [
        { timestamp: 1000000, price: 10, cut: 50 },
        { timestamp: 2000000, price: 8, cut: 60 },
      ]);
      expect(prediction.confidence).toBe('low');

      const game = createGame({
        id: 'game2',
        currentPrice: 8.50,
        basePrice: 20.00,
        historicalLow: 8.00,
      });

      const advice = advise(game, prediction);
      expect(advice.verdict).toBe('buy_now');
      expect(advice.reasons[0]).toContain('歴代最安値');
    });

    test('価格データ不足の場合は unknown を返す', () => {
      const prediction = predictSale('game3', []);
      expect(prediction.confidence).toBe('insufficient');

      const game = createGame({ id: 'game3' }); // 価格なし

      const advice = advise(game, prediction);
      expect(advice.verdict).toBe('unknown');
    });
  });

  // --- マルチソースマージ → 分析 ---
  describe('マルチソースデータからの分析', () => {
    test('Steam + ITAD + HLTB のマージデータで積みゲー分析ができる', () => {
      const steamData = [
        createGame({ id: '1', title: 'Game A', playtimeMinutes: 120, tags: ['RPG'], sourceFlags: ['steam'] }),
        createGame({ id: '2', title: 'Game B', playtimeMinutes: 0, tags: ['Action'], sourceFlags: ['steam'] }),
      ];
      const itadData = [
        createGame({ id: '1', basePrice: 29.99, currentPrice: 14.99, sourceFlags: ['itad'] }),
        createGame({ id: '2', basePrice: 19.99, currentPrice: 19.99, sourceFlags: ['itad'] }),
      ];
      const hltbData = [
        createGame({ id: '1', hltbMain: 600, sourceFlags: ['hltb'] }),
        createGame({ id: '2', hltbMain: 300, sourceFlags: ['hltb'] }),
      ];

      const merged = mergeGames([...steamData, ...itadData, ...hltbData]);
      expect(merged.length).toBe(2);

      // マージ後に全データが揃っている
      expect(merged[0].title).toBe('Game A');
      expect(merged[0].basePrice).toBe(29.99);
      expect(merged[0].hltbMain).toBe(600);
      expect(merged[0].sourceFlags).toEqual(expect.arrayContaining(['steam', 'itad', 'hltb']));

      // 積みゲー分析
      const backlog = analyzeBacklog(merged);
      expect(backlog.summary.total).toBe(2);

      const entryA = backlog.entries.find((e) => e.game.id === '1');
      const entryB = backlog.entries.find((e) => e.game.id === '2');

      expect(entryA.status).toBe('abandoned_mid'); // 120/600 = 0.2 → >= 0.2 so abandoned_mid
      expect(entryB.status).toBe('untouched');       // 0分

      // コスパも算出可能
      const costA = calculateCostPerHour(merged[0]);
      expect(costA).toBeCloseTo(29.99 / 2, 1); // 120分 = 2時間
    });
  });
});
