'use strict';

const { createGame } = require('../../src/engine/models');
const {
  fetchOwnedGames,
  fetchAppDetails,
  filterGamesOnly,
} = require('../../src/api/steam');

// fetch のグローバルモック
global.fetch = jest.fn();

afterEach(() => {
  jest.resetAllMocks();
});

describe('steam.js', () => {
  // --- fetchOwnedGames ---
  describe('fetchOwnedGames', () => {
    test('正常レスポンスから Game 配列を返す', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            games: [
              { appid: 440, name: 'Team Fortress 2', playtime_forever: 1200 },
              { appid: 570, name: 'Dota 2', playtime_forever: 500 },
            ],
          },
        }),
      });

      const result = await fetchOwnedGames('STEAM_ID', 'API_KEY');
      expect(result.games).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.games[0].id).toBe('440');
      expect(result.games[0].title).toBe('Team Fortress 2');
      expect(result.games[0].playtimeMinutes).toBe(1200);
      expect(result.games[0].sourceFlags).toContain('steam');
    });

    test('HTTP エラーは AppError を返す', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await fetchOwnedGames('STEAM_ID', 'API_KEY');
      expect(result.games).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe('steam');
      expect(result.errors[0].type).toBe('server');
      expect(result.errors[0].httpStatus).toBe(500);
      expect(result.errors[0].retryable).toBe(true);
    });

    test('ネットワークエラーは AppError を返す', async () => {
      global.fetch.mockRejectedValueOnce(new Error('fetch failed'));

      const result = await fetchOwnedGames('STEAM_ID', 'API_KEY');
      expect(result.games).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe('steam');
      expect(result.errors[0].type).toBe('network');
      expect(result.errors[0].retryable).toBe(true);
    });

    test('レスポンスに games がない場合は空配列を返す', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: {} }),
      });

      const result = await fetchOwnedGames('STEAM_ID', 'API_KEY');
      expect(result.games).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  // --- fetchAppDetails ---
  describe('fetchAppDetails', () => {
    test('正常レスポンスから Game の詳細フィールドを返す', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          '440': {
            success: true,
            data: {
              type: 'game',
              steam_appid: 440,
              name: 'Team Fortress 2',
              genres: [{ description: 'Action' }, { description: 'Free to Play' }],
              categories: [{ description: 'Multi-player' }],
              release_date: { coming_soon: false, date: 'Oct 10, 2007' },
              price_overview: { initial: 0, final: 0, discount_percent: 0 },
              metacritic: { score: 92 },
            },
          },
        }),
      });

      const result = await fetchAppDetails('440');
      expect(result.game).not.toBeNull();
      expect(result.game.id).toBe('440');
      expect(result.game.genres).toContain('Action');
      expect(result.game.releaseStatus).toBe('released');
      expect(result.error).toBeNull();
    });

    test('success: false の場合は game=null, error を返す', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          '440': { success: false },
        }),
      });

      const result = await fetchAppDetails('440');
      expect(result.game).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error.source).toBe('steam');
      expect(result.error.type).toBe('parse');
    });

    test('ネットワークエラーで AppError を返す', async () => {
      global.fetch.mockRejectedValueOnce(new Error('timeout'));

      const result = await fetchAppDetails('440');
      expect(result.game).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error.type).toBe('network');
    });
  });

  // --- filterGamesOnly ---
  describe('filterGamesOnly', () => {
    test('type: "game" のみを通過させる', () => {
      const items = [
        { type: 'game', appid: 440 },
        { type: 'dlc', appid: 441 },
        { type: 'tool', appid: 442 },
        { type: 'demo', appid: 443 },
        { type: 'music', appid: 444 },
        { type: 'video', appid: 445 },
        { type: 'game', appid: 570 },
      ];
      const result = filterGamesOnly(items);
      expect(result).toHaveLength(2);
      expect(result[0].appid).toBe(440);
      expect(result[1].appid).toBe(570);
    });

    test('空配列は空配列を返す', () => {
      expect(filterGamesOnly([])).toEqual([]);
    });

    test('type フィールドがない項目は除外する', () => {
      const items = [
        { appid: 440 },
        { type: 'game', appid: 570 },
      ];
      const result = filterGamesOnly(items);
      expect(result).toHaveLength(1);
      expect(result[0].appid).toBe(570);
    });
  });
});
