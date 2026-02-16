'use strict';

const { createGame } = require('../../src/engine/models');
const { aggregateTags, calculateTagRarity } = require('../../src/engine/tag-manager');
const { calculateTagProfile, scoreCandidate, rankCandidates, scoreSimilarCandidate } = require('../../src/engine/scorer');
const { mergeGames } = require('../../src/engine/aggregator');

describe('統合: レコメンドパイプライン', () => {
  // --- ライブラリ → タグプロファイル → レコメンド ---
  describe('ライブラリからレコメンドまでの一貫フロー', () => {
    const library = [
      createGame({ id: '1', title: 'Skyrim', tags: ['RPG', 'Open World', 'Fantasy'], playtimeMinutes: 6000, reviewScore: 92, reviewCount: 5000 }),
      createGame({ id: '2', title: 'Witcher 3', tags: ['RPG', 'Open World', 'Story Rich'], playtimeMinutes: 3000, reviewScore: 95, reviewCount: 8000 }),
      createGame({ id: '3', title: 'Stardew Valley', tags: ['Simulation', 'Farming', 'Pixel Graphics'], playtimeMinutes: 1500, reviewScore: 97, reviewCount: 10000 }),
      createGame({ id: '4', title: 'Factorio', tags: ['Automation', 'Strategy', 'Base Building'], playtimeMinutes: 2000, reviewScore: 96, reviewCount: 6000 }),
    ];

    const candidates = [
      createGame({ id: '10', title: 'Dragon Age', tags: ['RPG', 'Open World', 'Fantasy'], reviewScore: 88, reviewCount: 3000 }),
      createGame({ id: '11', title: 'Puzzle Quest', tags: ['Puzzle', 'Match 3'], reviewScore: 70, reviewCount: 500 }),
      createGame({ id: '12', title: 'Divinity OS2', tags: ['RPG', 'Story Rich', 'Turn-Based'], reviewScore: 93, reviewCount: 7000 }),
      createGame({ id: '13', title: 'Farm Together', tags: ['Simulation', 'Farming'], reviewScore: 75, reviewCount: 200 }),
    ];

    test('タグプロファイル算出 → 候補ランキングが一貫して動作する', () => {
      const profile = calculateTagProfile(library);

      // RPGとOpen Worldが最も高い重みを持つはず
      expect(profile.weights.RPG).toBeDefined();
      expect(profile.weights['Open World']).toBeDefined();
      expect(profile.weights.RPG).toBeGreaterThan(profile.weights.Simulation);

      // ランキングを取得
      const ranked = rankCandidates(candidates, profile, {});

      // RPG系のゲームが上位に来るはず
      expect(ranked.length).toBe(4);
      expect(ranked[0].score).toBeGreaterThan(ranked[3].score);

      // RPGタグを持つ Dragon Age か Divinity OS2 が上位
      const topIds = ranked.slice(0, 2).map((r) => r.game.id);
      expect(topIds).toContain('10'); // Dragon Age (RPG, Open World, Fantasy)
      expect(topIds).toContain('12'); // Divinity OS2 (RPG, Story Rich)
    });

    test('類似ゲーム検索: 特定ゲームに似た候補をスコアリングできる', () => {
      const sourceGame = library[0]; // Skyrim
      const tagRarity = calculateTagRarity(library);

      const scores = candidates.map((c) => ({
        game: c,
        score: scoreSimilarCandidate(c, sourceGame, tagRarity, {}),
      }));
      scores.sort((a, b) => b.score - a.score);

      // Skyrim (RPG, Open World, Fantasy) に最も似ているのは Dragon Age
      expect(scores[0].game.id).toBe('10');
    });
  });

  // --- マルチソースマージ → タグプロファイル → レコメンド ---
  describe('マルチソースマージ後のレコメンド', () => {
    test('Steam + ITAD でマージしたデータからプロファイルを構築できる', () => {
      const steamGames = [
        createGame({ id: '1', title: 'Half-Life 2', tags: ['FPS', 'Sci-Fi'], playtimeMinutes: 800, sourceFlags: ['steam'] }),
        createGame({ id: '2', title: 'Portal 2', tags: ['Puzzle', 'FPS'], playtimeMinutes: 400, sourceFlags: ['steam'] }),
      ];
      const itadGames = [
        createGame({ id: '1', currentPrice: 9.99, historicalLow: 2.49, sourceFlags: ['itad'] }),
        createGame({ id: '2', currentPrice: 19.99, historicalLow: 4.99, sourceFlags: ['itad'] }),
      ];

      const merged = mergeGames([...steamGames, ...itadGames]);

      // マージ後のデータで属性が両方揃っている
      expect(merged[0].title).toBe('Half-Life 2');
      expect(merged[0].currentPrice).toBe(9.99);
      expect(merged[0].sourceFlags).toContain('steam');
      expect(merged[0].sourceFlags).toContain('itad');

      // マージデータからプロファイル構築
      const profile = calculateTagProfile(merged);
      expect(profile.weights.FPS).toBeDefined();
      expect(profile.weights.Puzzle).toBeDefined();

      // FPSは2本(800+400分)、Puzzleは1本(400分)、Sci-Fiは1本(800分)
      expect(profile.weights.FPS).toBeGreaterThan(profile.weights.Puzzle);
    });
  });

  // --- タグ集計とレコメンドの整合性 ---
  describe('タグ集計とレコメンドの整合性', () => {
    test('aggregateTags の結果と calculateTagProfile の重みの方向性が一致する', () => {
      const games = [
        createGame({ tags: ['RPG', 'Action'], playtimeMinutes: 500 }),
        createGame({ tags: ['RPG', 'Puzzle'], playtimeMinutes: 300 }),
        createGame({ tags: ['Action', 'Simulation'], playtimeMinutes: 100 }),
      ];

      const tagCounts = aggregateTags(games);
      const profile = calculateTagProfile(games);

      // aggregateTagsで最も多いタグはRPG(2回)とAction(2回)
      expect(tagCounts.RPG).toBe(2);
      expect(tagCounts.Action).toBe(2);

      // calculateTagProfileでもRPGが最も高い重み（プレイ時間加重）
      // RPG: 500+300=800, Action: 500+100=600
      expect(profile.weights.RPG).toBeGreaterThan(profile.weights.Action);
    });
  });
});
