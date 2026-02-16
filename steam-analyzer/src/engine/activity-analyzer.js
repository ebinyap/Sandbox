'use strict';

/**
 * PlaySession 配列から月別サマリーを構築する
 * @param {PlaySession[]} sessions
 * @returns {{ [month: string]: MonthlySummary }}
 */
function buildMonthlySummary(sessions) {
  const result = {};

  for (const s of sessions) {
    const d = new Date(s.startedAt);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!result[month]) {
      result[month] = {
        totalMinutes: 0,
        sessionCount: 0,
        games: [],
        mostPlayed: null,
      };
    }

    const entry = result[month];
    entry.totalMinutes += s.durationMinutes;
    entry.sessionCount += 1;

    let gameEntry = entry.games.find((g) => g.gameId === s.gameId);
    if (!gameEntry) {
      gameEntry = { gameId: s.gameId, minutes: 0, sessionCount: 0 };
      entry.games.push(gameEntry);
    }
    gameEntry.minutes += s.durationMinutes;
    gameEntry.sessionCount += 1;
  }

  // mostPlayed を算出
  for (const entry of Object.values(result)) {
    if (entry.games.length > 0) {
      entry.mostPlayed = entry.games.reduce((a, b) =>
        a.minutes >= b.minutes ? a : b
      ).gameId;
    }
  }

  return result;
}

/**
 * 月別サマリーから四半期別サマリーを動的生成する
 * @param {{ [month: string]: MonthlySummary }} monthly
 * @returns {{ [quarter: string]: { totalMinutes: number, sessionCount: number } }}
 */
function buildQuarterlySummary(monthly) {
  const result = {};

  for (const [month, data] of Object.entries(monthly)) {
    const [year, m] = month.split('-').map(Number);
    const q = Math.ceil(m / 3);
    const key = `${year}-Q${q}`;

    if (!result[key]) {
      result[key] = { totalMinutes: 0, sessionCount: 0 };
    }
    result[key].totalMinutes += data.totalMinutes;
    result[key].sessionCount += data.sessionCount;
  }

  return result;
}

/**
 * 月別サマリーから年別サマリーを動的生成する
 * @param {{ [month: string]: MonthlySummary }} monthly
 * @returns {{ [year: string]: { totalMinutes: number, sessionCount: number } }}
 */
function buildYearlySummary(monthly) {
  const result = {};

  for (const [month, data] of Object.entries(monthly)) {
    const year = month.split('-')[0];

    if (!result[year]) {
      result[year] = { totalMinutes: 0, sessionCount: 0 };
    }
    result[year].totalMinutes += data.totalMinutes;
    result[year].sessionCount += data.sessionCount;
  }

  return result;
}

module.exports = { buildMonthlySummary, buildQuarterlySummary, buildYearlySummary };
