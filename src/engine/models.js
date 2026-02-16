'use strict';

const crypto = require('crypto');

/**
 * Game ファクトリ — 内部共通データモデル (SEC-MODEL-GAME)
 */
function createGame(overrides = {}) {
  return {
    id: overrides.id ?? '',
    title: overrides.title ?? '',
    playtimeMinutes: overrides.playtimeMinutes ?? null,
    tags: overrides.tags ?? [],
    genres: overrides.genres ?? [],
    basePrice: overrides.basePrice ?? null,
    currentPrice: overrides.currentPrice ?? null,
    historicalLow: overrides.historicalLow ?? null,
    discountRate: overrides.discountRate ?? null,
    hltbMain: overrides.hltbMain ?? null,
    reviewScore: overrides.reviewScore ?? null,
    reviewCount: overrides.reviewCount ?? null,
    lastPlayedAt: overrides.lastPlayedAt ?? null,
    releaseDate: overrides.releaseDate ?? null,
    releaseStatus: overrides.releaseStatus ?? 'released',
    storeUrl: overrides.storeUrl ?? null,
    itadUrl: overrides.itadUrl ?? null,
    sourceFlags: overrides.sourceFlags ?? [],
  };
}

/**
 * AppError ファクトリ (SEC-MODEL-ERROR)
 */
function createAppError(overrides = {}) {
  return {
    source: overrides.source ?? 'internal',
    type: overrides.type ?? 'unknown',
    message: overrides.message ?? '',
    retryable: overrides.retryable ?? false,
    retryAfterMs: overrides.retryAfterMs ?? null,
    httpStatus: overrides.httpStatus ?? null,
    timestamp: overrides.timestamp ?? Date.now(),
    context: overrides.context ?? null,
    correlationId: overrides.correlationId ?? crypto.randomUUID(),
  };
}

/**
 * FetchResult ファクトリ (SEC-MODEL-FETCH)
 */
function createFetchResult(overrides = {}) {
  return {
    games: overrides.games ?? [],
    errors: overrides.errors ?? [],
    summary: overrides.summary ?? {
      total: 0,
      succeeded: 0,
      failed: 0,
      sourceStatus: {
        steam: 'ok',
        itad: 'ok',
        hltb: 'ok',
      },
    },
  };
}

module.exports = { createGame, createAppError, createFetchResult };
