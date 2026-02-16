'use strict';

const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('@playwright/test');
const path = require('path');

const BINARY_PATH = path.join(__dirname, '..', '..', 'dist', 'linux-unpacked', 'steam-analyzer');

let electronApp;
let page;

test.beforeAll(async () => {
  electronApp = await electron.launch({
    executablePath: BINARY_PATH,
    args: ['--e2e'],
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

// ── ビルド済みバイナリ基本検証 ──

test('ビルド済みバイナリでウィンドウが表示される', async () => {
  const title = await page.title();
  expect(title).toBe('Steam Analyzer');
});

test('ビルド済みバイナリで5タブが存在する', async () => {
  const buttons = await page.$$('#tab-nav button');
  expect(buttons.length).toBe(5);
});

test('ビルド済みバイナリでタブ切り替えが動作する', async () => {
  await page.click('#tab-nav button[data-tab="watchlist"]');
  await expect(page.locator('#tab-watchlist')).toBeVisible();

  await page.click('#tab-nav button[data-tab="statistics"]');
  await expect(page.locator('#tab-statistics')).toBeVisible();

  await page.click('#tab-nav button[data-tab="store-recommend"]');
  await expect(page.locator('#tab-store-recommend')).toBeVisible();
});

test('ビルド済みバイナリでapiオブジェクトが公開されている', async () => {
  const hasApi = await page.evaluate(() => typeof window.api === 'object' && window.api !== null);
  expect(hasApi).toBe(true);
});

test('ビルド済みバイナリでIPC通信が動作する', async () => {
  const result = await page.evaluate(() => window.api.getLibrary());
  expect(result).toHaveProperty('success', true);
  expect(Array.isArray(result.data)).toBe(true);
});

test('ビルド済みバイナリでSettings読み書きが動作する', async () => {
  await page.evaluate(() => window.api.setSettings('buildTest', 'ok'));
  const result = await page.evaluate(() => window.api.getSettings('buildTest', null));
  expect(result.data).toBe('ok');
});

test('ビルド済みバイナリでcontextIsolationが有効', async () => {
  const hasRequire = await page.evaluate(() => typeof require === 'function');
  expect(hasRequire).toBe(false);
});

test('ビルド済みバイナリでCSPが設定されている', async () => {
  const csp = await page.evaluate(() => {
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    return meta ? meta.getAttribute('content') : null;
  });
  expect(csp).toContain("default-src 'self'");
});
