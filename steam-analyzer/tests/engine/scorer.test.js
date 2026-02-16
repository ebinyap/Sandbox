'use strict';

const { createGame } = require('../../src/engine/models');
const {
  calculateTagProfile,
  scoreCandidate,
  rankCandidates,
  scoreSimilarCandidate,
} = require('../../src/engine/scorer');

describe('scorer', () => {
  // --- calculateTagProfile ---
  describe('calculateTagProfile', () => {
    test('空配列は空の weights を返す', () => {
      const profile = calculateTagProfile([]);
      expect(profile.weights).toEqual({});
    });

    test('プレイ時間0のゲームのタグは加算しない', () => {
      const games = [
        createGame({ tags: ['RPG'], playtimeMinutes: 0 }),
        createGame({ tags: ['Action'], playtimeMinutes: 100 }),
      ];
      const profile = calculateTagProfile(games);
      expect(profile.weights.RPG).toBeUndefined();
      expect(profile.weights.Action).toBeDefined();
    });

    test('プレイ時間に比例してタグの重みが決まる', () => {
      const games = [
        createGame({ tags: ['RPG', 'Action'], playtimeMinutes: 200 }),
        createGame({ tags: ['RPG', 'Puzzle'], playtimeMinutes: 100 }),
      ];
      const profile = calculateTagProfile(games);
      // RPG: 200 + 100 = 300, Action: 200, Puzzle: 100
      // 最大値 300 で正規化 → RPG: 1.0, Action: 0.667, Puzzle: 0.333
      expect(profile.weights.RPG).toBeCloseTo(1.0, 2);
      expect(profile.weights.Action).toBeCloseTo(200 / 300, 2);
      expect(profile.weights.Puzzle).toBeCloseTo(100 / 300, 2);
    });

    test('null プレイ時間のゲームは無視する', () => {
      const games = [
        createGame({ tags: ['RPG'], playtimeMinutes: null }),
        createGame({ tags: ['Action'], playtimeMinutes: 50 }),
      ];
      const profile = calculateTagProfile(games);
      expect(profile.weights.RPG).toBeUndefined();
      expect(profile.weights.Action).toBeDefined();
    });

    test('source は全て "auto" になる', () => {
      const games = [
        createGame({ tags: ['RPG'], playtimeMinutes: 100 }),
      ];
      const profile = calculateTagProfile(games);
      expect(profile.source.RPG).toBe('auto');
    });
  });

  // --- scoreCandidate ---
  describe('scoreCandidate', () => {
    const profile = {
      weights: { RPG: 1.0, Action: 0.5, Puzzle: 0.3 },
      source: { RPG: 'auto', Action: 'auto', Puzzle: 'auto' },
      lastUpdated: Date.now(),
    };
    const defaultSettings = {};

    test('プロファイルと一致するタグが多いほどスコアが高い', () => {
      const a = createGame({ id: '1', tags: ['RPG', 'Action'] });
      const b = createGame({ id: '2', tags: ['Strategy'] });
      const scoreA = scoreCandidate(a, profile, defaultSettings);
      const scoreB = scoreCandidate(b, profile, defaultSettings);
      expect(scoreA).toBeGreaterThan(scoreB);
    });

    test('レビュースコアが高いほどスコアにボーナスが付く', () => {
      const high = createGame({ id: '1', tags: ['RPG'], reviewScore: 95, reviewCount: 1000 });
      const low = createGame({ id: '2', tags: ['RPG'], reviewScore: 40, reviewCount: 1000 });
      const scoreHigh = scoreCandidate(high, profile, defaultSettings);
      const scoreLow = scoreCandidate(low, profile, defaultSettings);
      expect(scoreHigh).toBeGreaterThan(scoreLow);
    });

    test('reviewScore が null でもエラーにならない', () => {
      const game = createGame({ id: '1', tags: ['RPG'], reviewScore: null });
      expect(() => scoreCandidate(game, profile, defaultSettings)).not.toThrow();
    });

    test('スコアは 0 以上を返す', () => {
      const game = createGame({ id: '1', tags: [] });
      const score = scoreCandidate(game, profile, defaultSettings);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  // --- rankCandidates ---
  describe('rankCandidates', () => {
    const profile = {
      weights: { RPG: 1.0, Action: 0.5 },
      source: { RPG: 'auto', Action: 'auto' },
      lastUpdated: Date.now(),
    };

    test('スコア降順にソートされる', () => {
      const candidates = [
        createGame({ id: '1', tags: ['Strategy'] }),
        createGame({ id: '2', tags: ['RPG', 'Action'] }),
        createGame({ id: '3', tags: ['RPG'] }),
      ];
      const ranked = rankCandidates(candidates, profile, {});
      expect(ranked[0].game.id).toBe('2');
      expect(ranked[1].game.id).toBe('3');
      expect(ranked[2].game.id).toBe('1');
    });

    test('各要素に game と score が含まれる', () => {
      const candidates = [createGame({ id: '1', tags: ['RPG'] })];
      const ranked = rankCandidates(candidates, profile, {});
      expect(ranked[0]).toHaveProperty('game');
      expect(ranked[0]).toHaveProperty('score');
      expect(typeof ranked[0].score).toBe('number');
    });

    test('空配列は空配列を返す', () => {
      expect(rankCandidates([], profile, {})).toEqual([]);
    });
  });

  // --- scoreSimilarCandidate ---
  describe('scoreSimilarCandidate', () => {
    test('タグが一致し rarity が高いほどスコアが高い', () => {
      const source = createGame({ id: '1', tags: ['RPG', 'Unique', 'Action'] });
      const tagRarity = { RPG: 0.0, Unique: 0.9, Action: 0.3 };

      const goodMatch = createGame({ id: '2', tags: ['RPG', 'Unique', 'Action'] });
      const badMatch = createGame({ id: '3', tags: ['Puzzle'] });

      const scoreGood = scoreSimilarCandidate(goodMatch, source, tagRarity, {});
      const scoreBad = scoreSimilarCandidate(badMatch, source, tagRarity, {});
      expect(scoreGood).toBeGreaterThan(scoreBad);
    });

    test('rarity が高い共通タグほど重視される', () => {
      const source = createGame({ id: '1', tags: ['Common', 'Rare'] });
      const tagRarity = { Common: 0.0, Rare: 0.9, Other: 0.5 };

      const matchRare = createGame({ id: '2', tags: ['Rare'] });
      const matchCommon = createGame({ id: '3', tags: ['Common'] });

      const scoreRare = scoreSimilarCandidate(matchRare, source, tagRarity, {});
      const scoreCommon = scoreSimilarCandidate(matchCommon, source, tagRarity, {});
      expect(scoreRare).toBeGreaterThan(scoreCommon);
    });
  });
});
