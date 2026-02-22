'use strict';

const { createGame, createAppError } = require('../engine/models');

const STEAM_API_BASE = 'https://api.steampowered.com';
const STORE_API_BASE = 'https://store.steampowered.com/api';

/**
 * HTTP エラーステータスから AppError.type を判定
 */
function classifyHttpError(status) {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'server';
  return 'unknown';
}

/**
 * type: "game" のみを通過させるフィルタ
 */
function filterGamesOnly(items) {
  return items.filter((item) => item.type === 'game');
}

/**
 * 所持ゲーム一覧を取得する
 * @param {string} steamId
 * @param {string} apiKey
 * @returns {Promise<{ games: Game[], errors: AppError[] }>}
 */
async function fetchOwnedGames(steamId, apiKey) {
  try {
    const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&format=json`;
    const res = await fetch(url);

    if (!res.ok) {
      const errType = classifyHttpError(res.status);
      return {
        games: [],
        errors: [
          createAppError({
            source: 'steam',
            type: errType,
            message: `Steam API error: ${res.status} ${res.statusText}`,
            retryable: errType === 'server' || errType === 'rate_limit',
            httpStatus: res.status,
            context: 'fetchOwnedGames',
          }),
        ],
      };
    }

    const data = await res.json();
    const rawGames = data.response?.games || [];

    const games = rawGames.map((g) =>
      createGame({
        id: String(g.appid),
        title: g.name || '',
        playtimeMinutes: g.playtime_forever ?? null,
        lastPlayedAt: g.rtime_last_played
          ? new Date(g.rtime_last_played * 1000)
          : null,
        sourceFlags: ['steam'],
      })
    );

    return { games, errors: [] };
  } catch (err) {
    return {
      games: [],
      errors: [
        createAppError({
          source: 'steam',
          type: 'network',
          message: err.message,
          retryable: true,
          context: 'fetchOwnedGames',
        }),
      ],
    };
  }
}

/**
 * アプリ詳細を取得する
 * @param {string} appId
 * @returns {Promise<{ game: Game|null, error: AppError|null }>}
 */
async function fetchAppDetails(appId) {
  try {
    const url = `${STORE_API_BASE}/appdetails?appids=${appId}`;
    const res = await fetch(url);

    if (!res.ok) {
      const errType = classifyHttpError(res.status);
      return {
        game: null,
        error: createAppError({
          source: 'steam',
          type: errType,
          message: `Steam Store API error: ${res.status}`,
          retryable: errType === 'server' || errType === 'rate_limit',
          httpStatus: res.status,
          context: `fetchAppDetails:${appId}`,
        }),
      };
    }

    const data = await res.json();
    const entry = data[appId];

    if (!entry || !entry.success) {
      return {
        game: null,
        error: createAppError({
          source: 'steam',
          type: 'parse',
          message: `App details not available for ${appId}`,
          retryable: false,
          context: `fetchAppDetails:${appId}`,
        }),
      };
    }

    const d = entry.data;
    const comingSoon = d.release_date?.coming_soon ?? false;
    const releaseDate = d.release_date?.date ? new Date(d.release_date.date) : null;
    let releaseStatus = 'released';
    if (comingSoon) releaseStatus = 'upcoming';
    if (d.release_date?.date === 'TBD' || d.release_date?.date === '') releaseStatus = 'tbd';

    const game = createGame({
      id: String(d.steam_appid),
      title: d.name || '',
      genres: (d.genres || []).map((g) => g.description),
      basePrice: d.price_overview ? d.price_overview.initial / 100 : null,
      currentPrice: d.price_overview ? d.price_overview.final / 100 : null,
      discountRate: d.price_overview ? d.price_overview.discount_percent : null,
      reviewScore: d.metacritic?.score ?? null,
      releaseDate: releaseDate,
      releaseStatus: releaseStatus,
      storeUrl: `https://store.steampowered.com/app/${appId}`,
      sourceFlags: ['steam'],
    });

    return { game, error: null };
  } catch (err) {
    return {
      game: null,
      error: createAppError({
        source: 'steam',
        type: 'network',
        message: err.message,
        retryable: true,
        context: `fetchAppDetails:${appId}`,
      }),
    };
  }
}

/**
 * Steam ウィッシュリストを取得する
 * @param {string} steamId
 * @returns {Promise<{ items: Array<{gameId: string, title: string}>, errors: AppError[] }>}
 */
async function fetchWishlist(steamId) {
  try {
    const url = `${STORE_API_BASE}/../wishlist/profiles/${steamId}/wishlistdata/?p=0`;
    const res = await fetch(url);

    if (!res.ok) {
      const errType = classifyHttpError(res.status);
      return {
        items: [],
        errors: [
          createAppError({
            source: 'steam',
            type: errType,
            message: `Steam Wishlist API error: ${res.status} ${res.statusText}`,
            retryable: errType === 'server' || errType === 'rate_limit',
            httpStatus: res.status,
            context: 'fetchWishlist',
          }),
        ],
      };
    }

    const data = await res.json();
    const items = Object.entries(data).map(([appId, info]) => ({
      gameId: String(appId),
      title: info.name || '',
    }));

    return { items, errors: [] };
  } catch (err) {
    return {
      items: [],
      errors: [
        createAppError({
          source: 'steam',
          type: 'network',
          message: err.message,
          retryable: true,
          context: 'fetchWishlist',
        }),
      ],
    };
  }
}

module.exports = { fetchOwnedGames, fetchAppDetails, fetchWishlist, filterGamesOnly };
