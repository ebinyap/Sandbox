'use strict';

const { fetchHltb } = require('../../src/api/hltb');

// howlongtobeat パッケージのモック
jest.mock('howlongtobeat', () => {
  return {
    HowLongToBeatService: jest.fn().mockImplementation(() => ({
      search: jest.fn(),
    })),
  };
}, { virtual: true });

const { HowLongToBeatService } = require('howlongtobeat');

afterEach(() => {
  jest.resetAllMocks();
});

describe('hltb.js', () => {
  describe('fetchHltb', () => {
    test('正常レスポンスから hltbMain（分）を返す', async () => {
      const mockSearch = jest.fn().mockResolvedValueOnce([
        {
          id: '1234',
          name: 'Half-Life 2',
          gameplayMain: 13,
          gameplayMainExtra: 18.5,
          gameplayCompletionist: 30,
        },
      ]);
      HowLongToBeatService.mockImplementation(() => ({ search: mockSearch }));

      const result = await fetchHltb('Half-Life 2');
      expect(result.hltbMain).toBe(13 * 60); // 時間 → 分
      expect(result.error).toBeNull();
    });

    test('検索結果が空の場合は null を返す', async () => {
      const mockSearch = jest.fn().mockResolvedValueOnce([]);
      HowLongToBeatService.mockImplementation(() => ({ search: mockSearch }));

      const result = await fetchHltb('NonExistentGame12345');
      expect(result.hltbMain).toBeNull();
      expect(result.error).toBeNull();
    });

    test('エラー発生時は AppError を返す', async () => {
      const mockSearch = jest.fn().mockRejectedValueOnce(new Error('HLTB timeout'));
      HowLongToBeatService.mockImplementation(() => ({ search: mockSearch }));

      const result = await fetchHltb('Half-Life 2');
      expect(result.hltbMain).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error.source).toBe('hltb');
      expect(result.error.type).toBe('network');
      expect(result.error.retryable).toBe(true);
    });

    test('gameplayMain が 0 の場合は null を返す', async () => {
      const mockSearch = jest.fn().mockResolvedValueOnce([
        {
          id: '999',
          name: 'Multiplayer Only',
          gameplayMain: 0,
          gameplayMainExtra: 0,
          gameplayCompletionist: 0,
        },
      ]);
      HowLongToBeatService.mockImplementation(() => ({ search: mockSearch }));

      const result = await fetchHltb('Multiplayer Only');
      expect(result.hltbMain).toBeNull();
    });
  });
});
