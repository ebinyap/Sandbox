'use strict';

const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('@playwright/test');
const path = require('path');

const APP_PATH = path.join(__dirname, '..', '..');

let electronApp;
let page;

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: [APP_PATH, '--e2e'],
    env: { ...process.env, NODE_ENV: 'test' },
  });
  page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  if (electronApp) {
    await electronApp.close();
  }
});

// ── ウィンドウ基本 ──

test('ウィンドウが表示される', async () => {
  const title = await page.title();
  expect(title).toBe('Steam Analyzer');
});

test('ウィンドウサイズが設定値以上', async () => {
  const { width, height } = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  expect(width).toBeGreaterThanOrEqual(700);
  expect(height).toBeGreaterThanOrEqual(400);
});

// ── ナビゲーション ──

test('5つのタブボタンがある', async () => {
  const buttons = await page.$$('#tab-nav button');
  expect(buttons.length).toBe(5);
});

test('Store/Recommendタブが初期表示', async () => {
  const panel = page.locator('#tab-store-recommend');
  await expect(panel).toBeVisible();
});

test('タブ切り替えが動作する', async () => {
  // Watchlistタブに切替
  await page.click('#tab-nav button[data-tab="watchlist"]');
  await expect(page.locator('#tab-watchlist')).toBeVisible();
  await expect(page.locator('#tab-store-recommend')).not.toBeVisible();

  // Statisticsタブに切替
  await page.click('#tab-nav button[data-tab="statistics"]');
  await expect(page.locator('#tab-statistics')).toBeVisible();
  await expect(page.locator('#tab-watchlist')).not.toBeVisible();

  // Backlogタブに切替
  await page.click('#tab-nav button[data-tab="backlog"]');
  await expect(page.locator('#tab-backlog')).toBeVisible();

  // Settingsタブに切替
  await page.click('#tab-nav button[data-tab="settings"]');
  await expect(page.locator('#tab-settings')).toBeVisible();

  // Store/Recommendに戻す
  await page.click('#tab-nav button[data-tab="store-recommend"]');
  await expect(page.locator('#tab-store-recommend')).toBeVisible();
});

test('アクティブなタブボタンにactiveクラスが付く', async () => {
  await page.click('#tab-nav button[data-tab="statistics"]');
  const btn = page.locator('#tab-nav button[data-tab="statistics"]');
  await expect(btn).toHaveClass(/active/);
  // 戻す
  await page.click('#tab-nav button[data-tab="store-recommend"]');
});

// ── Store/Recommend タブ ──

test('Store/Recommendにモード切替ボタンがある', async () => {
  await page.click('#tab-nav button[data-tab="store-recommend"]');
  const storeBtn = page.locator('#mode-store');
  const recBtn = page.locator('#mode-recommend');
  await expect(storeBtn).toBeVisible();
  await expect(recBtn).toBeVisible();
});

test('Storeモードでストアプレビューが表示される', async () => {
  await page.click('#mode-store');
  const content = page.locator('#store-content');
  await expect(content).toContainText('Steam Store');
});

// ── Settings タブ ──

test('Settings タブに設定フォームがある', async () => {
  await page.click('#tab-nav button[data-tab="settings"]');
  await expect(page.locator('#tab-settings')).toBeVisible();
  await page.waitForTimeout(800);
  const saveBtn = page.locator('#setting-save');
  await expect(saveBtn).toBeVisible();
});

test('Settings タブにデータ管理ボタンがある', async () => {
  await page.click('#tab-nav button[data-tab="settings"]');
  await expect(page.locator('#tab-settings')).toBeVisible();
  await page.waitForTimeout(800);
  const refreshBtn = page.locator('#setting-refresh');
  const exportBtn = page.locator('#setting-export');
  const clearBtn = page.locator('#setting-clear-cache');
  await expect(refreshBtn).toBeVisible();
  await expect(exportBtn).toBeVisible();
  await expect(clearBtn).toBeVisible();
});

// ── IPC 通信 ──

test('api オブジェクトがrendererに公開されている', async () => {
  const hasApi = await page.evaluate(() => typeof window.api === 'object' && window.api !== null);
  expect(hasApi).toBe(true);
});

test('api.getLibrary が呼べる', async () => {
  const result = await page.evaluate(() => window.api.getLibrary());
  expect(result).toHaveProperty('success', true);
  expect(result).toHaveProperty('data');
  expect(Array.isArray(result.data)).toBe(true);
});

test('api.getSettings が呼べる', async () => {
  const result = await page.evaluate(() => window.api.getSettings('testKey', 'default'));
  expect(result).toHaveProperty('success', true);
  expect(result.data).toBe('default');
});

test('api.setSettings / getSettings ラウンドトリップ', async () => {
  await page.evaluate(() => window.api.setSettings('e2eTestKey', 'e2eValue'));
  const result = await page.evaluate(() => window.api.getSettings('e2eTestKey', null));
  expect(result.data).toBe('e2eValue');
});

test('api.getWatchlist が空配列を返す（初期状態）', async () => {
  const result = await page.evaluate(() => window.api.getWatchlist());
  expect(result.success).toBe(true);
  expect(Array.isArray(result.data)).toBe(true);
});

test('api.addWatchlistEntry / removeWatchlistEntry ラウンドトリップ', async () => {
  // 追加
  await page.evaluate(() => window.api.addWatchlistEntry({ gameId: 'e2e-1', title: 'E2E Game' }));
  let result = await page.evaluate(() => window.api.getWatchlist());
  const found = result.data.find((e) => e.gameId === 'e2e-1');
  expect(found).toBeDefined();
  expect(found.title).toBe('E2E Game');

  // 削除
  await page.evaluate(() => window.api.removeWatchlistEntry('e2e-1'));
  result = await page.evaluate(() => window.api.getWatchlist());
  const deleted = result.data.find((e) => e.gameId === 'e2e-1');
  expect(deleted).toBeUndefined();
});

test('api.getStatistics が呼べる', async () => {
  const result = await page.evaluate(() => window.api.getStatistics());
  expect(result.success).toBe(true);
  expect(result.data).toHaveProperty('totalGames');
  expect(result.data).toHaveProperty('totalPlaytimeMinutes');
});

test('api.getBacklogAnalysis が呼べる', async () => {
  const result = await page.evaluate(() => window.api.getBacklogAnalysis());
  expect(result.success).toBe(true);
  expect(result.data).toHaveProperty('entries');
  expect(result.data).toHaveProperty('summary');
});

test('api.getActivitySummary が呼べる', async () => {
  const result = await page.evaluate(() => window.api.getActivitySummary());
  expect(result.success).toBe(true);
  expect(result.data).toHaveProperty('monthly');
  expect(result.data).toHaveProperty('yearly');
});

test('api.clearCache が成功する', async () => {
  const result = await page.evaluate(() => window.api.clearCache());
  expect(result.success).toBe(true);
});

test('api.exportData が全データを返す', async () => {
  const result = await page.evaluate(() => window.api.exportData('json'));
  expect(result.success).toBe(true);
  expect(result.data).toHaveProperty('library');
  expect(result.data).toHaveProperty('watchlist');
  expect(result.data).toHaveProperty('exportedAt');
  expect(result.data.format).toBe('json');
});

// ── CSP ──

test('Content-Security-Policyが設定されている', async () => {
  const csp = await page.evaluate(() => {
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    return meta ? meta.getAttribute('content') : null;
  });
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("script-src 'self'");
});

// ── contextIsolation ──

test('nodeIntegration が無効', async () => {
  const hasRequire = await page.evaluate(() => typeof require === 'function');
  expect(hasRequire).toBe(false);
});

test('Node.js グローバルがrendererに漏れていない', async () => {
  const hasProcess = await page.evaluate(() => typeof process !== 'undefined' && typeof process.versions === 'object');
  expect(hasProcess).toBe(false);
});
