'use strict';

const { createGame } = require('../../src/engine/models');
const { mergeGames, mergeGamePair } = require('../../src/engine/aggregator');

describe('aggregator', () => {
  // --- mergeGamePair ---
  describe('mergeGamePair', () => {
    test('同じ id のゲームをマージする', () => {
      const steam = createGame({
        id: '440',
        title: 'Team Fortress 2',
        playtimeMinutes: 1200,
        tags: ['FPS', 'Multiplayer'],
        sourceFlags: ['steam'],
      });
      const itad = createGame({
        id: '440',
        title: 'Team Fortress 2',
        currentPrice: 0,
        historicalLow: 0,
        itadUrl: 'https://itad.example/tf2',
        sourceFlags: ['itad'],
      });
      const merged = mergeGamePair(steam, itad);
      expect(merged.id).toBe('440');
      expect(merged.playtimeMinutes).toBe(1200);
      expect(merged.currentPrice).toBe(0);
      expect(merged.historicalLow).toBe(0);
      expect(merged.tags).toEqual(['FPS', 'Multiplayer']);
      expect(merged.sourceFlags).toEqual(expect.arrayContaining(['steam', 'itad']));
    });

    test('null フィールドは他方の値で埋まる', () => {
      const a = createGame({
        id: '100',
        title: 'GameA',
        reviewScore: 85,
        hltbMain: null,
        sourceFlags: ['steam'],
      });
      const b = createGame({
        id: '100',
        hltbMain: 600,
        sourceFlags: ['hltb'],
      });
      const merged = mergeGamePair(a, b);
      expect(merged.reviewScore).toBe(85);
      expect(merged.hltbMain).toBe(600);
    });

    test('両方が非null の場合、先の値（base）を優先する', () => {
      const a = createGame({ id: '1', title: 'Base Title', sourceFlags: ['steam'] });
      const b = createGame({ id: '1', title: 'Override Title', sourceFlags: ['itad'] });
      const merged = mergeGamePair(a, b);
      expect(merged.title).toBe('Base Title');
    });

    test('sourceFlags はマージされる（重複なし）', () => {
      const a = createGame({ id: '1', sourceFlags: ['steam', 'itad'] });
      const b = createGame({ id: '1', sourceFlags: ['itad', 'hltb'] });
      const merged = mergeGamePair(a, b);
      expect(merged.sourceFlags).toEqual(['steam', 'itad', 'hltb']);
    });

    test('tags は base の値を使う（マージしない）', () => {
      const a = createGame({ id: '1', tags: ['RPG'], sourceFlags: ['steam'] });
      const b = createGame({ id: '1', tags: ['Action'], sourceFlags: ['itad'] });
      const merged = mergeGamePair(a, b);
      expect(merged.tags).toEqual(['RPG']);
    });
  });

  // --- mergeGames ---
  describe('mergeGames', () => {
    test('空配列は空配列を返す', () => {
      expect(mergeGames([])).toEqual([]);
    });

    test('ソースが1つなら変換なしで返す', () => {
      const games = [
        createGame({ id: '1', title: 'A', sourceFlags: ['steam'] }),
        createGame({ id: '2', title: 'B', sourceFlags: ['steam'] }),
      ];
      const result = mergeGames(games);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('A');
    });

    test('同一 id のゲームをまとめる', () => {
      const games = [
        createGame({ id: '440', title: 'TF2', playtimeMinutes: 100, sourceFlags: ['steam'] }),
        createGame({ id: '440', currentPrice: 0, sourceFlags: ['itad'] }),
        createGame({ id: '440', hltbMain: 300, sourceFlags: ['hltb'] }),
        createGame({ id: '570', title: 'Dota 2', sourceFlags: ['steam'] }),
      ];
      const result = mergeGames(games);
      expect(result).toHaveLength(2);

      const tf2 = result.find((g) => g.id === '440');
      expect(tf2.title).toBe('TF2');
      expect(tf2.playtimeMinutes).toBe(100);
      expect(tf2.currentPrice).toBe(0);
      expect(tf2.hltbMain).toBe(300);
      expect(tf2.sourceFlags).toEqual(expect.arrayContaining(['steam', 'itad', 'hltb']));
    });

    test('id の順序は最初に出現した順を保持する', () => {
      const games = [
        createGame({ id: '2', title: 'Second', sourceFlags: ['steam'] }),
        createGame({ id: '1', title: 'First', sourceFlags: ['steam'] }),
        createGame({ id: '2', hltbMain: 50, sourceFlags: ['hltb'] }),
      ];
      const result = mergeGames(games);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });
  });
});
