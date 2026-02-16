'use strict';

const { createGame, createAppError } = require('../engine/models');

const ITAD_API_BASE = 'https://api.isthereanydeal.com';

function classifyHttpError(status) {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'server';
  return 'unknown';
}

/**
 * 現在の最安値を取得する
 * @param {string} appId
 * @param {string} apiKey
 * @returns {Promise<{ game: Game|null, error: AppError|null }>}
 */
async function fetchCurrentPrice(appId, apiKey) {
  try {
    const url = `${ITAD_API_BASE}/games/prices/v2?key=${apiKey}&country=US`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([`app/${appId}`]),
    });

    if (!res.ok) {
      const errType = classifyHttpError(res.status);
      return {
        game: null,
        error: createAppError({
          source: 'itad',
          type: errType,
          message: `ITAD API error: ${res.status} ${res.statusText}`,
          retryable: errType === 'server' || errType === 'rate_limit',
          httpStatus: res.status,
          context: `fetchCurrentPrice:${appId}`,
        }),
      };
    }

    const data = await res.json();
    const priceEntry = data.prices?.[0];
    const deal = priceEntry?.deals?.[0];

    if (!deal) {
      return {
        game: null,
        error: createAppError({
          source: 'itad',
          type: 'parse',
          message: `No price data for ${appId}`,
          retryable: false,
          context: `fetchCurrentPrice:${appId}`,
        }),
      };
    }

    const game = createGame({
      id: appId,
      currentPrice: deal.price?.amount ?? null,
      basePrice: deal.regular?.amount ?? null,
      discountRate: deal.cut ?? null,
      itadUrl: deal.url || null,
      sourceFlags: ['itad'],
    });

    return { game, error: null };
  } catch (err) {
    return {
      game: null,
      error: createAppError({
        source: 'itad',
        type: 'network',
        message: err.message,
        retryable: true,
        context: `fetchCurrentPrice:${appId}`,
      }),
    };
  }
}

/**
 * セール履歴を取得する
 * @param {string} appId
 * @param {string} apiKey
 * @returns {Promise<{ history: Array, error: AppError|null }>}
 */
async function fetchPriceHistory(appId, apiKey) {
  try {
    const url = `${ITAD_API_BASE}/games/history/v2?key=${apiKey}&country=US`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([`app/${appId}`]),
    });

    if (!res.ok) {
      const errType = classifyHttpError(res.status);
      return {
        history: [],
        error: createAppError({
          source: 'itad',
          type: errType,
          message: `ITAD API error: ${res.status}`,
          retryable: errType === 'server' || errType === 'rate_limit',
          httpStatus: res.status,
          context: `fetchPriceHistory:${appId}`,
        }),
      };
    }

    const data = await res.json();
    const priceEntry = data.prices?.[0];
    const deals = priceEntry?.deals || [];

    const history = deals.map((d) => ({
      timestamp: d.timestamp,
      price: d.price?.amount ?? null,
      cut: d.cut ?? 0,
    }));

    return { history, error: null };
  } catch (err) {
    return {
      history: [],
      error: createAppError({
        source: 'itad',
        type: 'network',
        message: err.message,
        retryable: true,
        context: `fetchPriceHistory:${appId}`,
      }),
    };
  }
}

module.exports = { fetchCurrentPrice, fetchPriceHistory };
