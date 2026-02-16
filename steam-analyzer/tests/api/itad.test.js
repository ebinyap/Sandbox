'use strict';

const { fetchCurrentPrice, fetchPriceHistory } = require('../../src/api/itad');

global.fetch = jest.fn();

afterEach(() => {
  jest.resetAllMocks();
});

describe('itad.js', () => {
  // --- fetchCurrentPrice ---
  describe('fetchCurrentPrice', () => {
    test('正常レスポンスから価格情報を Game に変換する', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prices: [
            {
              id: 'app/440',
              deals: [
                {
                  price: { amount: 0, amountInt: 0, currency: 'USD' },
                  regular: { amount: 0, amountInt: 0, currency: 'USD' },
                  cut: 0,
                  url: 'https://store.steampowered.com/app/440',
                },
              ],
            },
          ],
        }),
      });

      const result = await fetchCurrentPrice('440', 'ITAD_KEY');
      expect(result.game).not.toBeNull();
      expect(result.game.id).toBe('440');
      expect(result.game.currentPrice).toBe(0);
      expect(result.game.sourceFlags).toContain('itad');
      expect(result.error).toBeNull();
    });

    test('deals が空の場合は game=null を返す', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prices: [{ id: 'app/440', deals: [] }],
        }),
      });

      const result = await fetchCurrentPrice('440', 'ITAD_KEY');
      expect(result.game).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error.type).toBe('parse');
    });

    test('HTTP エラーで AppError を返す', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const result = await fetchCurrentPrice('440', 'ITAD_KEY');
      expect(result.game).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error.source).toBe('itad');
      expect(result.error.type).toBe('rate_limit');
      expect(result.error.httpStatus).toBe(429);
    });

    test('ネットワークエラーで AppError を返す', async () => {
      global.fetch.mockRejectedValueOnce(new Error('network error'));

      const result = await fetchCurrentPrice('440', 'ITAD_KEY');
      expect(result.game).toBeNull();
      expect(result.error.source).toBe('itad');
      expect(result.error.type).toBe('network');
      expect(result.error.retryable).toBe(true);
    });
  });

  // --- fetchPriceHistory ---
  describe('fetchPriceHistory', () => {
    test('正常レスポンスからセール履歴を返す', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prices: [
            {
              id: 'app/440',
              deals: [
                { timestamp: 1700000000, price: { amount: 4.99 }, cut: 75 },
                { timestamp: 1690000000, price: { amount: 9.99 }, cut: 50 },
              ],
            },
          ],
        }),
      });

      const result = await fetchPriceHistory('440', 'ITAD_KEY');
      expect(result.history).toHaveLength(2);
      expect(result.history[0].price).toBe(4.99);
      expect(result.history[0].cut).toBe(75);
      expect(result.error).toBeNull();
    });

    test('ネットワークエラーで AppError を返す', async () => {
      global.fetch.mockRejectedValueOnce(new Error('timeout'));

      const result = await fetchPriceHistory('440', 'ITAD_KEY');
      expect(result.history).toEqual([]);
      expect(result.error.source).toBe('itad');
      expect(result.error.type).toBe('network');
    });
  });
});
