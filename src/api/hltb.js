'use strict';

const { HowLongToBeatService } = require('howlongtobeat');
const { createAppError } = require('../engine/models');

/**
 * ゲーム名で HLTB を検索し、メインストーリーのクリア時間（分）を返す
 * @param {string} title ゲーム名
 * @returns {Promise<{ hltbMain: number|null, error: AppError|null }>}
 */
async function fetchHltb(title) {
  try {
    const service = new HowLongToBeatService();
    const results = await service.search(title);

    if (!results || results.length === 0) {
      return { hltbMain: null, error: null };
    }

    const best = results[0];
    const hours = best.gameplayMain || 0;

    if (hours === 0) {
      return { hltbMain: null, error: null };
    }

    return { hltbMain: Math.round(hours * 60), error: null };
  } catch (err) {
    return {
      hltbMain: null,
      error: createAppError({
        source: 'hltb',
        type: 'network',
        message: err.message,
        retryable: true,
        context: `fetchHltb:${title}`,
      }),
    };
  }
}

module.exports = { fetchHltb };
