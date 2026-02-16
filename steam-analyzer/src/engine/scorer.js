'use strict';

/**
 * ライブラリからタグプロファイルを自動算出する (SEC-RECOMMEND)
 * プレイ時間をタグに按分し、最大値で正規化して 0〜1 の範囲にする。
 * プレイ時間 0 または null のゲームのタグは加算しない。
 *
 * @param {Game[]} games
 * @returns {TagProfile}
 */
function calculateTagProfile(games) {
  const rawWeights = {};

  for (const game of games) {
    const pt = game.playtimeMinutes;
    if (!pt || pt <= 0) continue;

    for (const tag of game.tags) {
      rawWeights[tag] = (rawWeights[tag] || 0) + pt;
    }
  }

  const maxWeight = Math.max(0, ...Object.values(rawWeights));
  const weights = {};
  const source = {};

  if (maxWeight > 0) {
    for (const [tag, raw] of Object.entries(rawWeights)) {
      weights[tag] = raw / maxWeight;
      source[tag] = 'auto';
    }
  }

  return { weights, source, lastUpdated: Date.now() };
}

/**
 * 候補ゲームのレコメンドスコアを算出する
 *
 * スコア要素:
 *   - タグマッチスコア（最大）: プロファイルとの一致度
 *   - レビュー評価（中）: reviewScore を 100 で正規化
 *
 * @param {Game} candidate
 * @param {TagProfile} profile
 * @param {object} settings
 * @returns {number}
 */
function scoreCandidate(candidate, profile, settings) {
  let tagScore = 0;
  for (const tag of candidate.tags) {
    tagScore += profile.weights[tag] || 0;
  }

  let reviewBonus = 0;
  if (candidate.reviewScore != null && candidate.reviewCount != null) {
    reviewBonus = (candidate.reviewScore / 100) * 0.3;
  }

  return Math.max(0, tagScore + reviewBonus);
}

/**
 * 候補をスコア降順にランキングする
 * @param {Game[]} candidates
 * @param {TagProfile} profile
 * @param {object} settings
 * @returns {{ game: Game, score: number }[]}
 */
function rankCandidates(candidates, profile, settings) {
  return candidates
    .map((game) => ({ game, score: scoreCandidate(game, profile, settings) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * 類似ゲームのスコアを算出する（TF-IDF ベース）
 *
 * 起点ゲームと候補の共通タグを、rarity で重み付けして合算。
 *
 * @param {Game} candidate
 * @param {Game} sourceGame
 * @param {TagRarity} tagRarity
 * @param {object} settings
 * @returns {number}
 */
function scoreSimilarCandidate(candidate, sourceGame, tagRarity, settings) {
  const sourceTags = new Set(sourceGame.tags);
  let score = 0;

  for (const tag of candidate.tags) {
    if (sourceTags.has(tag)) {
      const rarity = tagRarity[tag] || 0;
      score += 1 + rarity; // base 1 + rarity bonus
    }
  }

  if (candidate.reviewScore != null) {
    score += (candidate.reviewScore / 100) * 0.3;
  }

  return Math.max(0, score);
}

module.exports = {
  calculateTagProfile,
  scoreCandidate,
  rankCandidates,
  scoreSimilarCandidate,
};
